"use server";

import { createClient } from "@/lib/supabase/server";
import { AuditFormInput, AuditGroupInput, AuditItemInput, AuditItemOptionInput } from "./types";
import { revalidatePath } from "next/cache";

export async function getForms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tracker_audit_forms")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching forms:", error);
    return [];
  }
  return data;
}

export async function getForm(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tracker_audit_forms")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getFormStructure(formId: string) {
  const supabase = await createClient();
  
  // Fetch groups
  const { data: groups, error: groupsError } = await supabase
    .from("tracker_audit_groups")
    .select("*")
    .eq("form_id", formId)
    .order("order_index");

  if (groupsError) return [];

  // Fetch items for these groups
  const groupIds = groups.map(g => g.id);
  const { data: items, error: itemsError } = await supabase
    .from("tracker_audit_items")
    .select("*")
    .in("group_id", groupIds)
    .order("order_index");

  if (itemsError) return groups;

  // Fetch options for these items
  const itemIds = items.map(i => i.id);
  const { data: options, error: optionsError } = await supabase
    .from("tracker_audit_item_options")
    .select("*")
    .in("item_id", itemIds)
    .order("order_index");
    
  // Nest data
  const structure = groups.map(group => {
    const groupItems = items
      .filter(item => item.group_id === group.id)
      .map(item => ({
        ...item,
        options: options?.filter(opt => opt.item_id === item.id) || []
      }));
    return { ...group, items: groupItems };
  });

  return structure;
}

// --- Forms ---

export async function createForm(data: AuditFormInput) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: newForm, error } = await supabase
    .from("tracker_audit_forms")
    .insert([{ ...data, created_by: user.id }])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/audit/form-builder");
  return { success: true, data: newForm };
}

export async function updateForm(id: string, data: Partial<AuditFormInput>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracker_audit_forms")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/audit/form-builder");
  return { success: true };
}

export async function deleteForm(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracker_audit_forms")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/audit/form-builder");
  return { success: true };
}

// --- Groups ---

export async function createGroup(data: AuditGroupInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracker_audit_groups")
    .insert([data]);

  if (error) return { error: error.message };
  revalidatePath(`/audit/form-builder/${data.form_id}`);
  return { success: true };
}

export async function deleteGroup(id: string, formId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracker_audit_groups")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/audit/form-builder/${formId}`);
  return { success: true };
}

// --- Items ---

export async function createItem(data: AuditItemInput, formId: string) {
  const supabase = await createClient();
  const { data: newItem, error } = await supabase
    .from("tracker_audit_items")
    .insert([data])
    .select()
    .single();

  if (error) return { error: error.message };

  // If it's a yes/no toggle, create default options
  if (data.item_type === 'toggle_yes_no') {
    await supabase.from("tracker_audit_item_options").insert([
        { 
            item_id: newItem.id, 
            label: "Yes", 
            value: "yes", 
            is_default: true, 
            is_correct: true, 
            color: "success", 
            order_index: 0 
        },
        { 
            item_id: newItem.id, 
            label: "No", 
            value: "no", 
            is_default: false, 
            is_correct: false, 
            color: "destructive", 
            order_index: 1 
        }
    ]);
  }

  revalidatePath(`/audit/form-builder/${formId}`);
  return { success: true, data: newItem };
}

export async function updateItem(id: string, data: Partial<AuditItemInput>, formId: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from("tracker_audit_items")
      .update(data)
      .eq("id", id);
  
    if (error) return { error: error.message };
    revalidatePath(`/audit/form-builder/${formId}`);
    return { success: true };
}

export async function deleteItem(id: string, formId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracker_audit_items")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/audit/form-builder/${formId}`);
  return { success: true };
}

export async function reorderItems(items: { id: string, order_index: number }[], formId: string) {
    const supabase = await createClient();
    
    // We use a loop for now, or a more complex RPC if performance becomes an issue
    // For typical form sizes, individual updates in a loop are usually fine for admin actions
    for (const item of items) {
        await supabase
            .from("tracker_audit_items")
            .update({ order_index: item.order_index })
            .eq("id", item.id);
    }

    revalidatePath(`/audit/form-builder/${formId}`);
    return { success: true };
}

export async function reorderGroups(groups: { id: string, order_index: number }[], formId: string) {
    const supabase = await createClient();
    
    for (const group of groups) {
        await supabase
            .from("tracker_audit_groups")
            .update({ order_index: group.order_index })
            .eq("id", group.id);
    }

    revalidatePath(`/audit/form-builder/${formId}`);
    return { success: true };
}

// --- Options ---

export async function createOption(data: AuditItemOptionInput, formId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracker_audit_item_options")
    .insert([data]);

  if (error) return { error: error.message };
  revalidatePath(`/audit/form-builder/${formId}`);
  return { success: true };
}

export async function deleteOption(id: string, formId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracker_audit_item_options")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/audit/form-builder/${formId}`);
  return { success: true };
}

export async function syncItem(
    itemId: string, 
    itemData: Partial<AuditItemInput>, 
    options: (Partial<AuditItemOptionInput> & { id?: string })[],
    formId: string
) {
    const supabase = await createClient();

    // 1. Update Item Details
    const { error: itemError } = await supabase
        .from("tracker_audit_items")
        .update(itemData)
        .eq("id", itemId);

    if (itemError) return { error: itemError.message };

    // 2. Handle Options
    // Get current options to identify what to delete
    const { data: currentOptions } = await supabase
        .from("tracker_audit_item_options")
        .select("id")
        .eq("item_id", itemId);
    
    const existingIds = currentOptions?.map(o => o.id) || [];
    const incomingIds = options.filter(o => o.id).map(o => o.id as string);
    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));

    // Delete removed options
    if (idsToDelete.length > 0) {
        await supabase
            .from("tracker_audit_item_options")
            .delete()
            .in("id", idsToDelete);
    }

    // Upsert remaining options
    if (options.length > 0) {
        const optionsToUpsert = options.map((opt, index) => ({
            ...opt,
            item_id: itemId,
            order_index: index
        }));

        const { error: upsertError } = await supabase
            .from("tracker_audit_item_options")
            .upsert(optionsToUpsert);
        
        if (upsertError) return { error: upsertError.message };
    }

    revalidatePath(`/audit/form-builder/${formId}`);
    return { success: true };
}

export async function setDefaultOption(optionId: string, itemId: string, formId: string) {
  const supabase = await createClient();
  
  // First, set all options for this item to NOT default
  const { error: resetError } = await supabase
    .from("tracker_audit_item_options")
    .update({ is_default: false })
    .eq("item_id", itemId);

  if (resetError) return { error: resetError.message };

  // Then set the selected one as default
  const { error: setError } = await supabase
    .from("tracker_audit_item_options")
    .update({ is_default: true })
    .eq("id", optionId);

  if (setError) return { error: setError.message };

  revalidatePath(`/audit/form-builder/${formId}`);
  return { success: true };
}
