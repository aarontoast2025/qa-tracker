import { getForm, getFormStructure } from "@/app/(authenticated)/(standard)/audit/actions";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch data
  const [form, structure] = await Promise.all([
    getForm(id),
    getFormStructure(id)
  ]);

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const response = NextResponse.json({ form, structure });

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
