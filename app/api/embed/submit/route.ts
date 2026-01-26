import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      form_id, 
      header_data, 
      items,
      interaction_id,
      existing_record_id
    } = body;

    const supabase = createAdminClient();

    let submissionId = existing_record_id;

    // 1. Create or Update Submission
    const submissionData = {
        form_id,
        interaction_id: header_data.interaction_id,
        advocate_name: header_data.advocate_name,
        call_ani_dnis: header_data.call_ani_dnis,
        case_number: header_data.case_number,
        call_duration: header_data.call_duration,
        interaction_date: header_data.interaction_date || null,
        evaluation_date: header_data.evaluation_date || new Date().toISOString(),
        case_category: header_data.case_category,
        issue_concern: header_data.issue_concern,
        page_url: header_data.page_url
        // submitted_by: user?.id // omitted for now
    };

    if (submissionId) {
        const { error: subError } = await supabase
            .from('audit_submissions')
            .update(submissionData)
            .eq('id', submissionId);
        
        if (subError) throw subError;
        
        // Clear existing items to replace them
        await supabase.from('audit_submission_items').delete().eq('submission_id', submissionId);
    } else {
        const { data: newSub, error: subError } = await supabase
            .from('audit_submissions')
            .insert(submissionData)
            .select()
            .single();
        
        if (subError) throw subError;
        submissionId = newSub.id;
    }

    // 2. Insert Items
    if (items && items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
            submission_id: submissionId,
            item_id: item.item_id,
            answer_id: item.answer_id,
            answer_text: item.answer_text,
            feedback_text: item.feedback_text,
            selected_tags: item.selected_tags || []
        }));

        const { error: itemsError } = await supabase
            .from('audit_submission_items')
            .insert(itemsToInsert);
        
        if (itemsError) throw itemsError;
    }

    const response = NextResponse.json({ success: true, submission_id: submissionId });
    
    // CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error: any) {
    console.error("Submission error:", error);
    const response = NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
