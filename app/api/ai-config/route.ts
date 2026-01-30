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

    const response = NextResponse.json({ success: true, data });
    addCorsHeaders(response);
    return response;

  } catch (error: any) {
    console.error("Config save error:", error);
    const response = NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    addCorsHeaders(response);
    return response;
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

        const response = NextResponse.json({ success: true, data });
        addCorsHeaders(response);
        return response;
    } catch (error: any) {
        console.error("Config fetch error:", error);
        const response = NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
        addCorsHeaders(response);
        return response;
    }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  addCorsHeaders(response);
  return response;
}

function addCorsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
