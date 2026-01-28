import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { entity, id, updates } = await req.json();
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const table = entity === 'item' ? 'form_items' : 'form_item_options';
    
    // We rely on RLS to ensure the user can only update their own forms
    const { error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error(`API Update Error (${entity}):`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
