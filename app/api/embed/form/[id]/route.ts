import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Public function to get form structure without authentication
async function getPublicFormStructure(formId: string) {
  // Create a public Supabase client (no auth required)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  // Fetch form from new templates table
  const { data: form, error: formError } = await supabase
    .from("form_templates")
    .select("*")
    .eq("id", formId)
    .single();

  if (formError || !form) return null;

  // Fetch sections (formerly groups)
  const { data: sections, error: sectionsError } = await supabase
    .from("form_sections")
    .select("*")
    .eq("form_id", formId)
    .order("order_index");

  if (sectionsError) return { form, structure: [] };

  // Fetch items for these sections
  const sectionIds = sections.map(s => s.id);
  const { data: items, error: itemsError } = await supabase
    .from("form_items")
    .select("*")
    .in("section_id", sectionIds)
    .order("order_index");

  if (itemsError) return { form, structure: sections.map(s => ({ ...s, items: [] })) };

  // Fetch options for these items
  const itemIds = items.map(i => i.id);
  const { data: options, error: optionsError } = await supabase
    .from("form_item_options")
    .select("*")
    .in("item_id", itemIds)
    .order("order_index");

  // Fetch feedback templates
  const optionIds = options?.map(o => o.id) || [];
  const [genRes, tagsRes] = optionIds.length > 0 ? await Promise.all([
    supabase.from('feedback_general').select('*').in('option_id', optionIds),
    supabase.from('feedback_tags').select('*').in('option_id', optionIds)
  ]) : [{ data: [] }, { data: [] }];

  const generalFeedback = genRes.data || [];
  const feedbackTags = tagsRes.data || [];

  // Nest data and map to old structure for bookmarklet compatibility
  const structure = sections.map(section => {
    const sectionItems = items
      .filter(item => item.section_id === section.id)
      .map(item => ({
        ...item,
        // Map new fields to old names expected by bookmarklet
        question_text: item.label,
        item_type: item.type,
        options: (options || [])
          ?.filter(opt => opt.item_id === item.id)
          .map(opt => ({
            ...opt,
            feedback_general: generalFeedback.filter(f => f.option_id === opt.id),
            feedback_tags: feedbackTags.filter(f => f.option_id === opt.id)
          })) || []
      }));
    return { 
      ...section, 
      // Map section title to group title if needed (though bookmarklet uses .title)
      items: sectionItems 
    };
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

  return NextResponse.json(result);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
