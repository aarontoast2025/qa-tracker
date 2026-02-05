import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { EvaluationForm } from "@/components/evaluation-form";
import { getMyPermissions } from "@/lib/supabase/permissions";

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const permissions = await getMyPermissions();

  // 1. Fetch Assignment
  const { data: assignment } = await supabase
    .from("audit_evaluations_assigned")
    .select(`
      *,
      specialist:roster_employees(first_name, last_name, eid, supervisor),
      qa_id
    `)
    .eq("id", id)
    .single();

  if (!assignment) {
    notFound();
  }

  // 2. Check Access (Must be the assigned QA or have assignments.view permission)
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = assignment.qa_id === user?.id;
  const canView = permissions.includes("assignments.view");

  if (!isOwner && !canView) {
    // If they aren't the owner and don't have view permission, kick them out
    redirect("/audit/dashboard");
  }

  // 3. Fetch Form Template
  // If assignment has a specific form_id, use that. 
  // If not, fetch the active form (fallback logic needed if multiple active forms exist? For now assume one or pick first).
  let formId = assignment.form_id;
  
  if (!formId) {
    const { data: activeForm } = await supabase
      .from("form_templates")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .single();
    
    if (activeForm) {
      formId = activeForm.id;
    } else {
      return <div>No active form template found. Please ask an admin to create/activate a form.</div>;
    }
  }

  // Fetch full form structure
  const { data: formTemplate } = await supabase
    .from("form_templates")
    .select(`
      id,
      title,
      description,
      form_sections (
        id,
        title,
        order_index,
        form_items (
          id,
          label,
          short_name,
          type,
          order_index,
          form_item_options (
            id,
            label,
            value,
            color,
            is_default,
            is_correct,
            order_index
          )
        )
      )
    `)
    .eq("id", formId)
    .single();

  if (!formTemplate) {
    return <div>Form template not found.</div>;
  }

  // 4. Sort sections and items (Supabase doesn't always sort nested arrays by default unless using order())
  // Note: .order() in query works for top level, but nested requires careful syntax or client-side sort.
  // We'll sort client-side/here to be safe.
  formTemplate.form_sections.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
  formTemplate.form_sections.forEach((s: any) => {
    s.form_items.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
    s.form_items.forEach((i: any) => {
      i.form_item_options.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
    });
  });

  const specialist = Array.isArray(assignment.specialist) ? assignment.specialist[0] : assignment.specialist;
  const specialistName = `${specialist?.first_name || ""} ${specialist?.last_name || ""}`;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      <EvaluationForm 
        assignmentId={assignment.id}
        formTemplate={formTemplate}
        initialData={assignment} // The assignment object now contains the evaluation fields
        specialistName={specialistName}
      />
    </div>
  );
}
