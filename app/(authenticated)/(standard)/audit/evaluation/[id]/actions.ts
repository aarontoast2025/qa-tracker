"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

interface SavePayload {
  assignmentId: string;
  formId: string;
  metadata: any;
  formData: any;
  score: number;
  status: string;
}

export async function saveEvaluation(payload: SavePayload) {
  try {
    const supabase = await createClient();
    const { assignmentId, formId, metadata, formData, score, status } = payload;

    // Fetch current assignment state to check for existing supervisor
    const { data: currentAssign } = await supabase
      .from("audit_evaluations_assigned")
      .select("supervisor, specialist_id, specialist:roster_employees(supervisor)")
      .eq("id", assignmentId)
      .single();

    // Prepare update data for audit_evaluations_assigned
    const updateData: any = {
      form_id: formId,
      interaction_id: metadata.interaction_id,
      call_ani: metadata.call_ani,
      case_number: metadata.case_number,
      call_duration: metadata.call_duration,
      date_interaction: metadata.date_interaction || null,
      case_category: metadata.case_category,
      issue_concern: metadata.issue_concern,
      form_data: formData,
      qa_score: score,
      status: status,
      updated_at: new Date().toISOString()
    };

    // Capture supervisor if not already captured
    const specialist = Array.isArray(currentAssign?.specialist) 
      ? currentAssign?.specialist[0] 
      : currentAssign?.specialist;

    if (!currentAssign?.supervisor && specialist?.supervisor) {
      updateData.supervisor = specialist.supervisor;
    }

    if (status === 'completed') {
      updateData.assignment_date = format(new Date(), 'yyyy-MM-dd');
    }

    const { error } = await supabase
      .from("audit_evaluations_assigned")
      .update(updateData)
      .eq("id", assignmentId);

    if (error) return { error: error.message };

    revalidatePath("/audit/dashboard");
    revalidatePath(`/audit/evaluation/${assignmentId}`);
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred" };
  }
}

export async function submitEvaluation(payload: SavePayload) {
    // Re-use save logic but force status to 'completed'
    return saveEvaluation({ ...payload, status: 'completed' });
}
