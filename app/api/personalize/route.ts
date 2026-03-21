import { NextResponse } from 'next/server';
import { createAdminClient } from "@/lib/supabase/admin";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const DEFAULT_PERSONALIZE_PROMPT_TEMPLATE = `Using the provided transcript, rephrase the following feedback items to be specific to the interaction.
Each personalized feedback must be exactly one paragraph in English.
If the original feedback is in Filipino, translate and rephrase it into English.
Maintain the core message but add context from the transcript.
Return the result in JSON format where keys are the item IDs and values are the personalized feedback strings.

Transcript:
{{transcript}}

Items to personalize:
{{items}}`;

export async function POST(req: Request) {
  try {
    const { transcript, items } = await req.json();

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'Valid transcript is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      console.error('Gemini API key is not configured');
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const supabase = createAdminClient();
    const { data: config } = await supabase
        .from('ai_features_config')
        .select('*')
        .eq('feature_key', 'personalize')
        .maybeSingle();
    
    const { data: terms } = await supabase
        .from('ai_dictionary_terms')
        .select('term, definition');

    const model = config?.model_name || DEFAULT_GEMINI_MODEL;
    const template = config?.prompt_template || DEFAULT_PERSONALIZE_PROMPT_TEMPLATE;

    let dictionaryContext = "";
    if (terms && terms.length > 0) {
        dictionaryContext = "GLOSSARY / CONTEXT DEFINITIONS:\n" + 
            terms.map((t: any) => `- ${t.term}: ${t.definition || '(no definition)'}`).join("\n");
    }

    const itemsFormatted = items.map(item => `ID: ${item.id}, Question: ${item.question}, Current Feedback: ${item.original_feedback}`).join("\n");

    let prompt = template;
    
    // Robust replacement strategy
    const replacements: Record<string, string> = {
        '{{transcript}}': transcript,
        '{{items}}': itemsFormatted
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
        const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        // Using a function as the second argument to replace avoids $ special character interpretation
        prompt = prompt.replace(regex, () => value || '(empty)');
    });

    if (dictionaryContext) {
        prompt = `${dictionaryContext}\n\n${prompt}`;
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: config?.temperature ?? 0.7,
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Gemini API error:', errData);
      return NextResponse.json({ error: errData.error?.message || 'Gemini API error' }, { status: response.status });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      console.error('No result generated from Gemini response:', data);
      return NextResponse.json({ error: 'Failed to generate personalized feedback' }, { status: 500 });
    }

    try {
        const personalizedItems = JSON.parse(resultText);
        return NextResponse.json({ success: true, data: personalizedItems });
    } catch (e) {
        console.error('Failed to parse AI response as JSON:', resultText);
        return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Personalization error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
