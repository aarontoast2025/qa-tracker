import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interactionId = searchParams.get('interaction_id');
    const formId = searchParams.get('form_id');

    if (!interactionId || !formId) {
      return NextResponse.json({ error: "Missing interaction_id or form_id" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // We try to find the most recent submission for this interaction and form
    const { data: submission, error: subError } = await supabase
      .from('audit_submissions')
      .select('*')
      .eq('interaction_id', interactionId)
      .eq('form_id', formId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error("Check existing error:", subError);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    if (!submission) {
      const response = NextResponse.json({ data: null });
      response.headers.set('Access-Control-Allow-Origin', '*');
      return response;
    }

    // Also fetch the items for this submission
    const { data: items, error: itemsError } = await supabase
      .from('audit_submission_items')
      .select('*')
      .eq('submission_id', submission.id);

    if (itemsError) {
      console.error("Fetch items error:", itemsError);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    const response = NextResponse.json({ data: { ...submission, items } });
    
    // CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error: any) {
    console.error("Check existing API error:", error);
    const response = NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
