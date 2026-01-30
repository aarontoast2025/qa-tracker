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
Evaluate the Subject Line and Case Notes. Provide feedback and a recommended version for each section: Subject Line, Issue, Steps Taken, and Resolution. 
Then provide "General Feedback: Important Missing Details".

FORMAT:
Follow this exact format strictly:

Subject Line
Feedback: [One paragraph feedback]
Recommended Subject Line:
• [Recommendation 1]
• [Recommendation 2]

---------------------------------------------------------

Issue
Feedback: [One paragraph feedback]
Recommended Issue:
Issue: [Recommended issue text]

---------------------------------------------------------

Steps Taken
Feedback: [One paragraph feedback]
Recommended Steps Taken:
Steps Taken:
• [Step 1]
• [Step 2]

---------------------------------------------------------

Resolution
Feedback: [One paragraph feedback]
Recommended Resolution:
Resolution: [Recommended resolution text]

---------------------------------------------------------

General Feedback: Important Missing Details
[One paragraph summarizing major omissions or critical feedback]

INSTRUCTIONS:
- Use 'customer' and 'Specialist' instead of names.
- Be specific about dates, amounts, and other relevant details mentioned in transcript.
- Do not include phone numbers or company codes.
- Ensure the feedback is constructive and highlights exactly what was missing or could be improved based on the transcript and guidelines.`;

export async function POST(req: Request) {
  try {
    const { transcript, subject, notes } = await req.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const supabase = createAdminClient();

    // 1. Fetch Config
    const { data: config } = await supabase
        .from('ai_features_config')
        .select('*')
        .eq('feature_key', 'case_notes')
        .maybeSingle();
    
    // 2. Fetch Guidelines
    const { data: guidelines } = await supabase
        .from('guidelines')
        .select('topic, title, content, description');

    // 3. Build Guidelines Context
    const guidelinesText = (guidelines || []).map(g => {
        const points = Array.isArray(g.description) 
            ? g.description.map((d: any) => `${d.is_important ? '[IMPORTANT] ' : ''}${d.text}`).join('\n')
            : g.description;
        return `Topic: ${g.topic} - ${g.title}\nContent: ${g.content || ''}\nGuidelines:\n${points}`;
    }).join('\n\n');

    const model = config?.model_name || DEFAULT_GEMINI_MODEL;
    const template = config?.prompt_template || DEFAULT_PROMPT_TEMPLATE;

    // 4. Construct Prompt
    let prompt = template
        .replace(/\{\{guidelines\}\}/g, guidelinesText)
        .replace(/\{\{transcript\}\}/g, transcript)
        .replace(/\{\{subject\}\}/g, subject)
        .replace(/\{\{notes\}\}/g, notes);

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
