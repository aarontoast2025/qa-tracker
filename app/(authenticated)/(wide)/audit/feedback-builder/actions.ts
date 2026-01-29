"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateOptionFeedback(optionId: string, feedbackText: string, formId: string, source: string = "") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('feedback_general')
    .upsert({ 
      option_id: optionId, 
      user_id: user.id,
      feedback_text: feedbackText,
      source: source
    }, { 
      onConflict: 'option_id,user_id' 
    });

  if (error) throw error;
  
  revalidatePath(`/audit/feedback-builder/${formId}`);
}

export async function saveItemTag(tag: {
  id?: string;
  option_id: string;
  tag_label: string;
  feedback_text: string;
  source?: string;
}, formId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  if (tag.id) {
    const { error } = await supabase
      .from('feedback_tags')
      .update({
        tag_label: tag.tag_label,
        feedback_text: tag.feedback_text,
        option_id: tag.option_id,
        source: tag.source || ""
      })
      .eq('id', tag.id)
      .eq('user_id', user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('feedback_tags')
      .insert({
        option_id: tag.option_id,
        user_id: user.id,
        tag_label: tag.tag_label,
        feedback_text: tag.feedback_text,
        source: tag.source || ""
      });
    if (error) throw error;
  }

  revalidatePath(`/audit/feedback-builder/${formId}`);
}

export async function deleteItemTag(tagId: string, formId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('feedback_tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', user.id);

  if (error) throw error;
  revalidatePath(`/audit/feedback-builder/${formId}`);
}

export async function getFormWithFeedback(formId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  // 1. Get form structure from NEW tables with proper relational joins
  const { data: form, error: formError } = await supabase
    .from('form_templates')
    .select(`
      id,
      title,
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
            is_correct,
            is_default,
            color,
            order_index
          )
        )
      )
    `)
    .eq('id', formId)
    .order('order_index', { foreignTable: 'form_sections' })
    .single();

  if (formError) throw formError;

  // 2. Sort nested items and options
  if (form.form_sections) {
      form.form_sections.forEach((section: any) => {
          if (section.form_items) {
              section.form_items.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
              section.form_items.forEach((item: any) => {
                  if (item.form_item_options) {
                      item.form_item_options.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
                  }
              });
          }
      });
  }

  // 3. Get user feedback
  const optionIds = (form.form_sections || [])
    .flatMap((s: any) => s.form_items || [])
    .flatMap((i: any) => i.form_item_options || [])
    .map((o: any) => o.id);

  let generalMap: Record<string, string> = {};
  let tagsMap: Record<string, any[]> = {};

  if (optionIds.length > 0) {
    const [generalRes, tagsRes] = await Promise.all([
        supabase
          .from('feedback_general')
          .select('option_id, feedback_text, source')
          .in('option_id', optionIds)
          .eq('user_id', user.id),
        supabase
          .from('feedback_tags')
          .select('id, option_id, tag_label, feedback_text, source')
          .in('option_id', optionIds)
          .eq('user_id', user.id)
      ]);

      generalMap = (generalRes.data || []).reduce((acc: any, curr: any) => {
        acc[curr.option_id] = { feedback_text: curr.feedback_text, source: curr.source };
        return acc;
      }, {});

      tagsMap = (tagsRes.data || []).reduce((acc: any, curr: any) => {
        if (!acc[curr.option_id]) acc[curr.option_id] = [];
        acc[curr.option_id].push(curr);
        return acc;
      }, {});
  }

  // 4. Merge feedback into form structure
  const adaptedForm = {
      ...form,
      tracker_audit_groups: (form.form_sections || []).map((section: any) => ({
          ...section,
          tracker_audit_items: (section.form_items || []).map((item: any) => ({
              ...item,
              question_text: item.label,
              tracker_audit_item_options: (item.form_item_options || []).map((option: any) => ({
                  ...option,
                  feedback_general: generalMap[option.id] ? [generalMap[option.id]] : [],
                  feedback_tags: tagsMap[option.id] || []
              }))
          }))
      }))
  };

  return adaptedForm;
}
