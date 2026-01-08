-- 1. Enable the pg_net extension
-- NOTE: The extension name is "pg_net", not "net".
create extension if not exists "pg_net" with schema "extensions";

-- 2. Create the bridge function
create or replace function public.send_email_bridge(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- This forwards the email payload to your Next.js API
  -- Ensure the URL is correct.
  perform net.http_post(
    url := 'https://qa-tracker-toast.vercel.app/api/auth/hooks/send-email',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := event
  );

  -- Return a success response to Supabase Auth
  return jsonb_build_object('status', 'success');
end;
$$;

-- 3. Grant permission to the auth user
grant execute on function public.send_email_bridge(jsonb) to supabase_auth_admin;
