"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateOptionFeedback(optionId: string, feedbackText: string, formId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('feedback_general')
    .upsert({ 
      option_id: optionId, 
      user_id: user.id,
      feedback_text: feedbackText 
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
        option_id: tag.option_id
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
        feedback_text: tag.feedback_text
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

  // 1. Get form structure
  const { data: form, error: formError } = await supabase
    .from('tracker_audit_forms')
    .select(`
      id,
      title,
      tracker_audit_groups (
        id,
        title,
        order_index,
        tracker_audit_items (
          id,
          question_text,
          short_name,
          order_index,
          tracker_audit_item_options (
            id,
            label,
            is_correct,
            order_index
          )
        )
      )
    `)
    .eq('id', formId)
    .single();

  if (formError) throw formError;

  // 2. Get user feedback
  const optionIds = form.tracker_audit_groups
    .flatMap((g: any) => g.tracker_audit_items)
    .flatMap((i: any) => i.tracker_audit_item_options)
    .map((o: any) => o.id);

  const [generalRes, tagsRes] = await Promise.all([
    supabase
      .from('feedback_general')
      .select('option_id, feedback_text')
      .in('option_id', optionIds)
      .eq('user_id', user.id),
    supabase
      .from('feedback_tags')
      .select('id, option_id, tag_label, feedback_text')
      .in('option_id', optionIds)
      .eq('user_id', user.id)
  ]);

  const generalMap = (generalRes.data || []).reduce((acc: any, curr: any) => {
    acc[curr.option_id] = curr.feedback_text;
    return acc;
  }, {});

  const tagsMap = (tagsRes.data || []).reduce((acc: any, curr: any) => {
    if (!acc[curr.option_id]) acc[curr.option_id] = [];
    acc[curr.option_id].push(curr);
    return acc;
  }, {});

  // 3. Merge feedback into form structure
  form.tracker_audit_groups.forEach((group: any) => {
    group.tracker_audit_items.forEach((item: any) => {
      item.tracker_audit_item_options.forEach((option: any) => {
        option.feedback_general = generalMap[option.id] ? [{ feedback_text: generalMap[option.id] }] : [];
        option.feedback_tags = tagsMap[option.id] || [];
      });
    });
  });

  return form;
}
