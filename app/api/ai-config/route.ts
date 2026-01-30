import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feature_key, model_name, prompt_template } = body;

    if (!feature_key) {
        return NextResponse.json({ error: "Missing feature_key" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Upsert config
    const { data, error } = await supabase
        .from('ai_features_config')
        .upsert({ 
            feature_key, 
            model_name, 
            prompt_template,
            updated_at: new Date().toISOString()
        }, { onConflict: 'feature_key' })
        .select()
        .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Config save error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const feature_key = searchParams.get('feature_key');

        if (!feature_key) {
            return NextResponse.json({ error: "Missing feature_key" }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('ai_features_config')
            .select('*')
            .eq('feature_key', feature_key)
            .maybeSingle();
        
        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Config fetch error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
