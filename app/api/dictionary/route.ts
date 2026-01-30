import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function addCorsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export async function GET(request: Request) {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('ai_dictionary_terms')
            .select('*')
            .order('term', { ascending: true });

        if (error) throw error;

        const response = NextResponse.json({ success: true, data });
        addCorsHeaders(response);
        return response;
    } catch (error: any) {
        const response = NextResponse.json({ error: error.message }, { status: 500 });
        addCorsHeaders(response);
        return response;
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Expecting { term, definition } or Array of them
        const supabase = createAdminClient();
        
        const payload = Array.isArray(body) ? body : [body];

        // Basic validation
        if (payload.length === 0 || !payload[0].term) {
             return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('ai_dictionary_terms')
            .upsert(payload, { onConflict: 'term' })
            .select();

        if (error) throw error;

        const response = NextResponse.json({ success: true, data });
        addCorsHeaders(response);
        return response;

    } catch (error: any) {
        const response = NextResponse.json({ error: error.message }, { status: 500 });
        addCorsHeaders(response);
        return response;
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing id" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { error } = await supabase
            .from('ai_dictionary_terms')
            .delete()
            .eq('id', id);

        if (error) throw error;

        const response = NextResponse.json({ success: true });
        addCorsHeaders(response);
        return response;
    } catch (error: any) {
        const response = NextResponse.json({ error: error.message }, { status: 500 });
        addCorsHeaders(response);
        return response;
    }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  addCorsHeaders(response);
  return response;
}
