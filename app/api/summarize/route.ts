import { NextResponse } from 'next/server';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

// ============================================================================
// SUMMARY PROMPT TEMPLATE
// ============================================================================

const SUMMARY_PROMPT_TEMPLATE = (transcript: string) => `Summarize the following transcript in one concise pargraph.
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

    // Generate the prompt
    const prompt = SUMMARY_PROMPT_TEMPLATE(transcript);

    // Call Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: prompt }] 
        }],
        generationConfig: {
          temperature: 0.7,
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
