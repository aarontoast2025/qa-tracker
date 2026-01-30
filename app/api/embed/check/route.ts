import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const interactionId = searchParams.get('interaction_id');
    const formId = searchParams.get('form_id');

    if (!interactionId || !formId) {
      return NextResponse.json({ error: "Missing interaction_id or form_id" }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // We try to find the most recent submission for this interaction and form
    const { data: submission, error: subError } = await supabase
      .from('audit_evaluations')
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
      return NextResponse.json({ data: null });
    }

    // Map new table fields to old structure expected by frontend
    const mappedSubmission = {
      ...submission,
      call_ani_dnis: submission.call_ani,
      interaction_date: submission.date_interaction,
      evaluation_date: submission.date_evaluation,
      items: submission.form_data || []
    };

    return NextResponse.json({ data: mappedSubmission });
  } catch (error: any) {
    console.error("Check existing API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
