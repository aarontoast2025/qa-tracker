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

    // Check for existing record by interaction_id if no ID provided
    if (!submissionId && header_data.interaction_id) {
        const { data: existing } = await supabase
            .from('audit_evaluations')
            .select('id')
            .eq('interaction_id', header_data.interaction_id)
            .eq('form_id', form_id)
            .maybeSingle();
        
        if (existing) {
            submissionId = existing.id;
        }
    }

    // 1. Create or Update Submission in audit_evaluations
    const submissionData = {
        form_id,
        interaction_id: header_data.interaction_id,
        advocate_name: header_data.advocate_name,
        call_ani: header_data.call_ani_dnis,
        case_number: header_data.case_number,
        call_duration: header_data.call_duration,
        date_interaction: header_data.interaction_date || null,
        date_evaluation: header_data.evaluation_date || new Date().toISOString(),
        case_category: header_data.case_category,
        issue_concern: header_data.issue_concern,
        source_url: header_data.page_url,
        form_data: items || [], // Store items directly as JSONB
        status: 'completed'
    };

    let resultData;

    if (submissionId) {
        const { data, error: subError } = await supabase
            .from('audit_evaluations')
            .update(submissionData)
            .eq('id', submissionId)
            .select()
            .single();
        
        if (subError) throw subError;
        resultData = data;
    } else {
        const { data, error: subError } = await supabase
            .from('audit_evaluations')
            .insert(submissionData)
            .select()
            .single();
        
        if (subError) throw subError;
        submissionId = data.id;
        resultData = data;
    }

    // No need to insert separate items anymore

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
