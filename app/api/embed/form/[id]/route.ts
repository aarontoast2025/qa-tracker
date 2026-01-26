import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Public function to get form structure without authentication
async function getPublicFormStructure(formId: string) {
  // Create a public Supabase client (no auth required)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  // Fetch form
  const { data: form, error: formError } = await supabase
    .from("tracker_audit_forms")
    .select("*")
    .eq("id", formId)
    .single();

  if (formError || !form) return null;

  // Fetch groups
  const { data: groups, error: groupsError } = await supabase
    .from("tracker_audit_groups")
    .select("*")
    .eq("form_id", formId)
    .order("order_index");

  if (groupsError) return { form, structure: [] };

  // Fetch items for these groups
  const groupIds = groups.map(g => g.id);
  const { data: items, error: itemsError } = await supabase
    .from("tracker_audit_items")
    .select("*")
    .in("group_id", groupIds)
    .order("order_index");

  if (itemsError) return { form, structure: groups };

  // Fetch options for these items
  const itemIds = items.map(i => i.id);
  const { data: options, error: optionsError } = await supabase
    .from("tracker_audit_item_options")
    .select("*")
    .in("item_id", itemIds)
    .order("order_index");

  if (optionsError) return { form, structure: groups };

  // Fetch feedback templates (public, no user filter)
  const optionIds = options.map(o => o.id);
  const [genRes, tagsRes] = await Promise.all([
    supabase.from('feedback_general').select('*').in('option_id', optionIds),
    supabase.from('feedback_tags').select('*').in('option_id', optionIds)
  ]);

  const generalFeedback = genRes.data || [];
  const feedbackTags = tagsRes.data || [];

  // Nest data
  const structure = groups.map(group => {
    const groupItems = items
      .filter(item => item.group_id === group.id)
      .map(item => ({
        ...item,
        options: options
          ?.filter(opt => opt.item_id === item.id)
          .map(opt => ({
            ...opt,
            feedback_general: generalFeedback.filter(f => f.option_id === opt.id),
            feedback_tags: feedbackTags.filter(f => f.option_id === opt.id)
          })) || []
      }));
    return { ...group, items: groupItems };
  });

  return { form, structure };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch data using public access
  const result = await getPublicFormStructure(id);

  if (!result) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const response = NextResponse.json(result);

  // CORS Headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
