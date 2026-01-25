import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const prompt = `Summarize the following transcript in one concise paragraph.
Identify the customer's concern and how the specialist resolved it.
Do not use names, use 'customer' and 'Specialist' instead.
Do not use em-dashes. Specify the dates, amounts, and other relevant details as mentioned.
Do not include the phone numbers, or company codes as well.
The summary should start not from the confirmation of the details of the customers, but from the actual issue raised by the customer.

Transcript:
${transcript}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      return NextResponse.json({ error: errData.error?.message || 'Gemini API error' }, { status: response.status });
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Summarization error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
