import { NextResponse } from 'next/server';
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// CONFIGURATION DEFAULTS
// ============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

// ============================================================================
// DEFAULT SUMMARY PROMPT TEMPLATE
// ============================================================================

const DEFAULT_SUMMARY_PROMPT_TEMPLATE = (transcript: string) => `Summarize the following transcript in one concise pargraph.
Identify the customer's concern and how the specialist resolved it.
Do not use names, use 'customer' and 'Specialist' instead.
Do not use em-dashes. Specify the dates, amounts, the error messages, and other relevant details as mentioned.
Do not include the phone numbers, or company codes as well.
The summary should start not from the confirmation of the details of the customers, but from the actual issue raised by the customer.

Transcript:
${transcript}`;

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    // Validate input
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid transcript is required' }, 
        { status: 400 }
      );
    }

    // Check API key
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key is not configured');
      return NextResponse.json(
        { error: 'Gemini API key is not configured' }, 
        { status: 500 }
      );
    }

    // Fetch Configuration from DB
    const supabase = createAdminClient();
    const { data: config } = await supabase
        .from('ai_features_config')
        .select('*')
        .eq('feature_key', 'summary')
        .maybeSingle();
    
    // Fetch Dictionary Terms
    const { data: terms } = await supabase
        .from('ai_dictionary_terms')
        .select('term, definition');

    const model = config?.model_name || DEFAULT_GEMINI_MODEL;
    const template = config?.prompt_template || null;

    // Build Dictionary Context
    let dictionaryContext = "";
    if (terms && terms.length > 0) {
        dictionaryContext = "GLOSSARY / CONTEXT DEFINITIONS:\n" + 
            terms.map((t: any) => `- ${t.term}: ${t.definition || '(no definition)'}`).join("\n");
    }

    // Generate the prompt
    let prompt;
    if (template) {
        if (template.includes('{{transcript}}') || template.includes('{{TRANSCRIPT}}')) {
             prompt = template.replace(/\{\{transcript\}\}/ig, transcript);
             if (dictionaryContext) {
                 prompt = `Use the following glossary to understand specific terms or correct transcript errors:\n${dictionaryContext}\n\n${prompt}`;
             }
        } else {
             // Fallback: Append it
             prompt = `${template}\n\n${dictionaryContext ? dictionaryContext + "\n\n" : ""}Transcript:\n${transcript}`;
        }
    } else {
        prompt = `${dictionaryContext ? "Use the following glossary to understand specific terms or correct transcript errors:\n" + dictionaryContext + "\n\n" : ""}${DEFAULT_SUMMARY_PROMPT_TEMPLATE(transcript)}`;
    }

    // Call Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: prompt }] 
        }],
        generationConfig: {
          temperature: config?.temperature ?? 0.7,
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Gemini API error:', errData);
      return NextResponse.json(
        { error: errData.error?.message || 'Gemini API error' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      console.error('No summary generated from Gemini response:', data);
      return NextResponse.json(
        { error: 'Failed to generate summary' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ summary: summary.trim() });
    
  } catch (error: any) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}
