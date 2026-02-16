import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const DEFAULT_PROMPT_TEMPLATE = `You are a Quality Assurance Specialist. Your task is to analyze a Specialist's case notes based on a transcript of the interaction and established guidelines.

CONTEXT:
Guidelines:
{{guidelines}}

Transcript:
{{transcript}}

INPUT DATA TO EVALUATE:
Subject Line: {{subject}}
Case Notes: {{notes}}

TASK:
1. Generate a summary of the transcript based on these instructions: {{summary_prompt}}
2. Evaluate the Subject Line and Case Notes. Provide feedback and a recommended version for each section: Subject Line, Issue, Steps Taken, and Resolution.

FORMAT:
Follow this exact format strictly:

SUMMARY
[The summary of the transcript here]

---------------------------------------------------------

SUBJECT LINE
Feedback:
[Feedback for the subject line]

Recommended:
[Recommended subject line]

---------------------------------------------------------

ISSUE
Feedback:
[One paragraph feedback for the issue case note section]

Recommended:
[One paragraph recommended issue section]

---------------------------------------------------------

STEPS TAKEN
Feedback:
[One paragraph feedback for the steps taken section]

Recommended:
• [Step 1]
• [Step 2]
(Maximum of 6 bullet points)

---------------------------------------------------------

Resolution
Feedback:
[One paragraph feedback for the resolution section]

Recommended:
[One paragraph recommended resolution section]

INSTRUCTIONS:
- Use 'customer' and 'Specialist' instead of names.
- Be specific about dates, amounts, and other relevant details mentioned in transcript.
- Do not include phone numbers or company codes.
- Ensure the feedback is constructive and highlights exactly what was missing or could be improved based on the transcript and guidelines.
- For STEPS TAKEN Recommended, use bullet points and limit to a maximum of 6 items.`;

export async function POST(req: Request) {
  try {
    const { transcript, subject, notes } = await req.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const supabase = createAdminClient();

    // 1. Fetch Configs
    const { data: configs } = await supabase
        .from('ai_features_config')
        .select('*')
        .in('feature_key', ['case_notes', 'summary']);
    
    const caseNotesConfig = configs?.find(c => c.feature_key === 'case_notes');
    const summaryConfig = configs?.find(c => c.feature_key === 'summary');

    // 2. Fetch Guidelines
    const { data: guidelines, error: guidelinesError } = await supabase
        .from('guidelines')
        .select('topic, title, content, description');
    
    if (guidelinesError) console.error("Guidelines Fetch Error:", guidelinesError);

    // 2.5 Fetch Dictionary Terms
    const { data: terms, error: termsError } = await supabase
        .from('ai_dictionary_terms')
        .select('term, definition');
    
    if (termsError) console.error("Terms Fetch Error:", termsError);

    // 3. Build Guidelines Context
    const guidelinesText = (guidelines || []).map(g => {
        const points = Array.isArray(g.description) 
            ? g.description.map((d: any) => `${d.is_important ? '[IMPORTANT] ' : ''}${d.text}`).join('\n')
            : g.description;
        return `Topic: ${g.topic} - ${g.title}\nContent: ${g.content || ''}\nGuidelines:\n${points}`;
    }).join('\n\n');

    // 3.5 Build Dictionary Context
    let dictionaryContext = "";
    if (terms && terms.length > 0) {
        dictionaryContext = "GLOSSARY / CONTEXT DEFINITIONS:\n" + 
            terms.map((t: any) => `- ${t.term}: ${t.definition || '(no definition)'}`).join("\n");
    }

    const model = caseNotesConfig?.model_name || DEFAULT_GEMINI_MODEL;
    const template = caseNotesConfig?.prompt_template || DEFAULT_PROMPT_TEMPLATE;
    const summaryPrompt = summaryConfig?.prompt_template || "Summarize the transcript concisely, identifying the customer's concern and the resolution. Do not use names.";

    // 4. Construct Prompt
    let prompt = template;

    // Use a more robust replacement strategy
    const replacements: Record<string, string> = {
        '{{guidelines}}': guidelinesText,
        '{{transcript}}': transcript,
        '{{subject}}': subject,
        '{{notes}}': notes,
        '{{summary_prompt}}': summaryPrompt
    };

    let allPlaceholdersPresent = true;
    Object.entries(replacements).forEach(([placeholder, value]) => {
        const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        if (regex.test(prompt)) {
            prompt = prompt.replace(regex, value || '(empty)');
        } else {
            // summary_prompt might not be in a custom template, that's okay
            if (placeholder !== '{{summary_prompt}}') {
                allPlaceholdersPresent = false;
            }
        }
    });

    // If any key placeholder is missing from the template, append them as context
    if (!allPlaceholdersPresent) {
        prompt = `CONTEXT DATA:\n` +
                 `Guidelines: ${guidelinesText}\n\n` +
                 `Transcript: ${transcript}\n\n` +
                 `Subject Line: ${subject}\n\n` +
                 `Case Notes: ${notes}\n\n` +
                 `Summary Instructions: ${summaryPrompt}\n\n` +
                 `-------------------\n\n` +
                 `INSTRUCTION:\n${prompt}`;
    }

    if (dictionaryContext) {
        prompt = `${dictionaryContext}\n\n${prompt}`;
    }

    // 5. Call Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({ result: result?.trim() });
    
  } catch (error: any) {
    console.error('Case Notes Checker error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
