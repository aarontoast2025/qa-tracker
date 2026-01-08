import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirect(next);
    } else {
      redirect(`/auth/error?error=${error.message}`);
    }
  } else if (token && type && email) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token,
      email,
    });
    if (!error) {
      redirect(next);
    } else {
      redirect(`/auth/error?error=${error.message}`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=Invalid verification link`);
}
