-- Create a table for public profiles
create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  
  -- Personal Details
  first_name text,
  last_name text,
  middle_name text,
  personal_email text,
  home_address text,
  birthday date,
  mobile_number text,
  emergency_number text,
  emergency_person text,
  viber_number text,
  internet_provider text,
  internet_speed text,

  -- Employment Details
  company text,
  employee_id text,
  program text,
  nt_login text,
  company_email text,
  program_email text,
  zoom_id text,
  hire_date date,
  computer_name text,
  computer_type text, -- 'Laptop' or 'Desktop'
  vpn_ip text,
  ms_office_license text,
  unit_serial_number text,

  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.user_profiles enable row level security;

-- Drop existing policies to avoid "policy already exists" errors
drop policy if exists "Users can view their own profile." on public.user_profiles;
drop policy if exists "Users can insert their own profile." on public.user_profiles;
drop policy if exists "Users can update their own profile." on public.user_profiles;

-- Create policies
create policy "Users can view their own profile."
  on public.user_profiles for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile."
  on public.user_profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.user_profiles for update
  using ( auth.uid() = id );

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.user_profiles (id, program_email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Trigger the function every time a user is created
-- Drop the trigger if it exists to ensure we can recreate it cleanly
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
