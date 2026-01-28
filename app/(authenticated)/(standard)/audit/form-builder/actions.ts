"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createForm(title: string, description?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('form_templates')
    .insert({
      title,
      description,
      created_by: user.id,
      status: 'draft'
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/audit/form-builder');
  return data;
}

export async function getForms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('form_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getForm(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: form, error: formError } = await supabase
    .from('form_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (formError) throw formError;

  const { data: sections, error: sectionsError } = await supabase
    .from('form_sections')
    .select(`
        *,
        form_items (
            *,
            form_item_options (*)
        )
    `)
    .eq('form_id', id)
    .order('order_index');

  if (sectionsError) throw sectionsError;

  // Sort items and their options in JS
  const sortedSections = (sections || []).map(section => ({
    ...section,
    form_items: (section.form_items || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)).map((item: any) => ({
        ...item,
        form_item_options: (item.form_item_options || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    }))
  }));

  return { form, sections: sortedSections };
}

export async function updateSectionOrder(formId: string, sections: any[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const updates = sections.map((s, index) => ({
        id: s.id,
        order_index: index,
        updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
        .from('form_sections')
        .upsert(updates);

    if (error) throw error;
    revalidatePath(`/audit/form-builder/${formId}`);
}

export async function updateItemOrder(formId: string, items: any[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const updates = items.map((item, index) => ({
        id: item.id,
        section_id: item.section_id,
        order_index: index,
        label: item.label,
        short_name: item.short_name,
        type: item.type,
        updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
        .from('form_items')
        .upsert(updates);

    if (error) {
        console.error("Update Item Order Error:", error);
        throw error;
    }
    revalidatePath(`/audit/form-builder/${formId}`);
}

export async function addSection(formId: string, title: string = "") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get max order index
  const { data: sections, error: fetchError } = await supabase
    .from('form_sections')
    .select('order_index')
    .eq('form_id', formId)
    .order('order_index', { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error("Error fetching sections:", fetchError);
    throw fetchError;
  }

  const nextOrder = (sections?.[0]?.order_index ?? -1) + 1;

  const { data, error } = await supabase
    .from('form_sections')
    .insert({
      form_id: formId,
      title: title || "",
      order_index: nextOrder
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath(`/audit/form-builder/${formId}`);
  return data;
}

export async function updateSection(id: string, formId: string, updates: { title?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('form_sections')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
  revalidatePath(`/audit/form-builder/${formId}`);
}

export async function deleteSection(id: string, formId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('form_sections')
    .delete()
    .eq('id', id);

  if (error) throw error;
  revalidatePath(`/audit/form-builder/${formId}`);
}

export async function addItem(sectionId: string, formId: string, type: string = "toggle") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Get max order index for this section
  const { data: items } = await supabase
    .from('form_items')
    .select('order_index')
    .eq('section_id', sectionId)
    .order('order_index', { ascending: false })
    .limit(1);

  const nextOrder = (items?.[0]?.order_index ?? -1) + 1;

  const { data: item, error: itemError } = await supabase
    .from('form_items')
    .insert({
      section_id: sectionId,
      label: "",
      short_name: "",
      type,
      order_index: nextOrder,
    })
    .select()
    .single();

  if (itemError) throw itemError;

  // 2. Create default options
  let defaultOptions: any[] = [];
  if (type === 'toggle') {
    defaultOptions = [
        { item_id: item.id, label: "Yes", value: "yes", color: "green", is_default: true, is_correct: true, order_index: 0 }, 
        { item_id: item.id, label: "No", value: "no", color: "red", is_default: false, is_correct: false, order_index: 1 }
    ];
  } else if (type === 'dropdown') {
     defaultOptions = [
        { item_id: item.id, label: "", value: "", color: "gray", is_default: true, is_correct: true, order_index: 0 },
        { item_id: item.id, label: "", value: "", color: "gray", is_default: false, is_correct: false, order_index: 1 }
     ];
  }

  const { error: optionsError } = await supabase
    .from('form_item_options')
    .insert(defaultOptions);

  if (optionsError) throw optionsError;

  revalidatePath(`/audit/form-builder/${formId}`);
  return item;
}

export async function updateItem(id: string, formId: string, updates: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('form_items')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
  revalidatePath(`/audit/form-builder/${formId}`);
}

export async function deleteItem(id: string, formId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('form_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
  revalidatePath(`/audit/form-builder/${formId}`);
}

export async function updateFormStatus(id: string, status: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
  
    const { error } = await supabase
      .from('form_templates')
      .update({ status })
      .eq('id', id);
  
    if (error) throw error;
    revalidatePath(`/audit/form-builder/${id}`);
    revalidatePath(`/audit/form-builder`);
}

// Option Management
export async function addOption(itemId: string, formId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: options } = await supabase
        .from('form_item_options')
        .select('order_index')
        .eq('item_id', itemId)
        .order('order_index', { ascending: false })
        .limit(1);

    const nextOrder = (options?.[0]?.order_index ?? -1) + 1;

    const { data, error } = await supabase
        .from('form_item_options')
        .insert({
            item_id: itemId,
            label: "",
            value: "",
            color: "gray",
            order_index: nextOrder
        })
        .select()
        .single();

    if (error) throw error;
    return data;
    // Silent add - do not revalidatePath here to prevent state wipe
}

export async function updateOption(id: string, formId: string, updates: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Handle is_default logic: if setting to true, unset others for this item
    if (updates.is_default === true) {
        const { data: option } = await supabase.from('form_item_options').select('item_id').eq('id', id).single();
        if (option) {
            await supabase.from('form_item_options').update({ is_default: false }).eq('item_id', option.item_id);
        }
    }

    const { error } = await supabase
        .from('form_item_options')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
    revalidatePath(`/audit/form-builder/${formId}`);
}

export async function deleteOption(id: string, formId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('form_item_options')
        .delete()
        .eq('id', id);

    if (error) throw error;
    // Silent delete
}

export async function updateOptionOrder(formId: string, optionUpdates: any[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('form_item_options')
        .upsert(optionUpdates.map((opt, index) => ({
            id: opt.id,
            order_index: index,
            item_id: opt.item_id,
            label: opt.label,
            updated_at: new Date().toISOString()
        })));

    if (error) throw error;
    revalidatePath(`/audit/form-builder/${formId}`);
}
