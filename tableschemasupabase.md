user_profiles

create table public.user_profiles (
  id uuid not null,
  first_name text null,
  last_name text null,
  middle_name text null,
  personal_email text null,
  home_address text null,
  birthday date null,
  mobile_number text null,
  emergency_number text null,
  emergency_person text null,
  viber_number text null,
  internet_provider text null,
  internet_speed text null,
  company text null,
  employee_id text null,
  program text null,
  nt_login text null,
  company_email text null,
  program_email text null,
  zoom_id text null,
  hire_date date null,
  computer_name text null,
  computer_type text null,
  vpn_ip text null,
  ms_office_license text null,
  unit_serial_number text null,
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  role_id uuid null,
  is_suspended boolean null default false,
  avatar_url text null,
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint user_profiles_role_id_fkey foreign KEY (role_id) references user_roles (id)
) TABLESPACE pg_default;

create trigger tr_protect_admin_profiles BEFORE DELETE
or
update on user_profiles for EACH row
execute FUNCTION protect_admin_profiles ();


user_roles

create table public.user_roles (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint user_roles_pkey primary key (id),
  constraint user_roles_name_key unique (name)
) TABLESPACE pg_default;



user_permissions

create table public.user_permissions (
  id uuid not null default gen_random_uuid (),
  name text not null,
  code text not null,
  group_name text not null,
  description text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint user_permissions_pkey primary key (id),
  constraint user_permissions_code_key unique (code),
  constraint user_permissions_name_key unique (name)
) TABLESPACE pg_default;



user_role_permissions

create table public.user_role_permissions (
  role_id uuid not null,
  permission_id uuid not null,
  constraint user_role_permissions_pkey primary key (role_id, permission_id),
  constraint user_role_permissions_permission_id_fkey foreign KEY (permission_id) references user_permissions (id) on delete CASCADE,
  constraint user_role_permissions_role_id_fkey foreign KEY (role_id) references user_roles (id) on delete CASCADE
) TABLESPACE pg_default;



user_direct_permissions

create table public.user_direct_permissions (
  user_id uuid not null,
  permission_id uuid not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint user_direct_permissions_pkey primary key (user_id, permission_id),
  constraint user_direct_permissions_permission_id_fkey foreign KEY (permission_id) references user_permissions (id) on delete CASCADE,
  constraint user_direct_permissions_user_id_fkey foreign KEY (user_id) references user_profiles (id) on delete CASCADE
) TABLESPACE pg_default;



user_chats

create table public.user_chats (
  id uuid not null default gen_random_uuid (),
  sender_id uuid not null,
  receiver_id uuid not null,
  content text not null,
  is_read boolean null default false,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null,
  reply_to_id uuid null,
  constraint user_chats_pkey primary key (id),
  constraint user_chats_receiver_id_fkey foreign KEY (receiver_id) references user_profiles (id) on delete CASCADE,
  constraint user_chats_reply_to_id_fkey foreign KEY (reply_to_id) references user_chats (id) on delete set null,
  constraint user_chats_sender_id_fkey foreign KEY (sender_id) references user_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists user_chats_participants_idx on public.user_chats using btree (sender_id, receiver_id) TABLESPACE pg_default;

create index IF not exists user_chats_created_at_idx on public.user_chats using btree (created_at) TABLESPACE pg_default;

create index IF not exists user_chats_reply_to_id_idx on public.user_chats using btree (reply_to_id) TABLESPACE pg_default;



roster_employees

create table public.roster_employees (
  id uuid not null default gen_random_uuid (),
  eid text null,
  case_safe_id text null,
  toasttab_email text null,
  location text null,
  last_name text null,
  first_name text null,
  skill text null,
  channel text null,
  tier text null,
  role text null,
  status text null,
  wave text null,
  production_date date null,
  supervisor text null,
  manager text null,
  tenure numeric null,
  tenure_bucket text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  middle_name text null,
  constraint roster_employees_pkey primary key (id)
) TABLESPACE pg_default;

create trigger tr_update_tenure BEFORE INSERT
or
update OF production_date on roster_employees for EACH row
execute FUNCTION update_tenure_columns ();

create trigger update_roster_employees_modtime BEFORE
update on roster_employees for EACH row
execute FUNCTION update_modified_column ();




knowledge_base_pages

create table public.knowledge_base_pages (
  id uuid not null default gen_random_uuid (),
  user_id uuid null default auth.uid (),
  title text not null default 'Untitled'::text,
  content jsonb null default '[]'::jsonb,
  icon text null,
  cover_image text null,
  is_published boolean null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  source text null,
  constraint knowledge_base_pages_pkey primary key (id),
  constraint knowledge_base_pages_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create trigger update_knowledge_base_pages_modtime BEFORE
update on knowledge_base_pages for EACH row
execute FUNCTION update_modified_column ();




guidelines

create table public.guidelines (
  id uuid not null default gen_random_uuid (),
  topic text not null,
  title text not null,
  content text null,
  description jsonb null,
  skill text null,
  tags text[] null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint guidelines_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_guidelines_modtime BEFORE
update on guidelines for EACH row
execute FUNCTION update_modified_column ();




form_templates

create table public.form_templates (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text null,
  status text not null default 'draft'::text,
  created_by uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint form_templates_pkey primary key (id),
  constraint form_templates_created_by_fkey foreign KEY (created_by) references auth.users (id),
  constraint form_templates_status_check check (
    (
      status = any (
        array['draft'::text, 'active'::text, 'archived'::text]
      )
    )
  )
) TABLESPACE pg_default;

create trigger update_form_templates_modtime BEFORE
update on form_templates for EACH row
execute FUNCTION update_updated_at_column ();




form_sections

create table public.form_sections (
  id uuid not null default gen_random_uuid (),
  form_id uuid not null,
  title text not null,
  description text null,
  order_index integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint form_sections_pkey primary key (id),
  constraint form_sections_form_id_fkey foreign KEY (form_id) references form_templates (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_form_sections_modtime BEFORE
update on form_sections for EACH row
execute FUNCTION update_updated_at_column ();




form_items

create table public.form_items (
  id uuid not null default gen_random_uuid (),
  section_id uuid not null,
  type text not null default 'text'::text,
  label text not null,
  help_text text null,
  order_index integer null default 0,
  validation_rules jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  short_name text null,
  constraint form_items_pkey primary key (id),
  constraint form_items_section_id_fkey foreign KEY (section_id) references form_sections (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_form_items_modtime BEFORE
update on form_items for EACH row
execute FUNCTION update_updated_at_column ();




form_item_options

create table public.form_item_options (
  id uuid not null default gen_random_uuid (),
  item_id uuid not null,
  label text not null,
  value text null,
  is_default boolean null default false,
  is_correct boolean null default false,
  color text null default 'gray'::text,
  order_index integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint form_item_options_pkey primary key (id),
  constraint form_item_options_item_id_fkey foreign KEY (item_id) references form_items (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_form_item_options_modtime BEFORE
update on form_item_options for EACH row
execute FUNCTION update_updated_at_column ();





feedback_general

create table public.feedback_general (
  id uuid not null default gen_random_uuid (),
  option_id uuid null,
  user_id uuid null,
  feedback_text text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  source text null,
  constraint feedback_general_pkey primary key (id),
  constraint feedback_general_option_id_user_id_key unique (option_id, user_id),
  constraint feedback_general_option_id_fkey foreign KEY (option_id) references form_item_options (id) on delete CASCADE,
  constraint feedback_general_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_feedback_general_modtime BEFORE
update on feedback_general for EACH row
execute FUNCTION update_modified_column ();




feedback_tags

create table public.feedback_tags (
  id uuid not null default gen_random_uuid (),
  option_id uuid null,
  user_id uuid null,
  tag_label text not null,
  feedback_text text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  source text null,
  constraint feedback_tags_pkey primary key (id),
  constraint feedback_tags_option_id_fkey foreign KEY (option_id) references form_item_options (id) on delete CASCADE,
  constraint feedback_tags_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_feedback_tags_modtime BEFORE
update on feedback_tags for EACH row
execute FUNCTION update_modified_column ();





audit_evaluations

create table public.audit_evaluations (
  id uuid not null default gen_random_uuid (),
  form_id uuid null,
  interaction_id text null,
  advocate_name text null,
  call_ani text null,
  case_number text null,
  call_duration text null,
  date_interaction timestamp with time zone null,
  date_evaluation timestamp with time zone null default now(),
  case_category text null,
  issue_concern text null,
  source_url text null,
  form_data jsonb null,
  status text null default 'completed'::text,
  qa_score numeric null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_audited boolean null default false,
  constraint audit_evaluations_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_audit_evaluations_modtime BEFORE
update on audit_evaluations for EACH row
execute FUNCTION update_modified_column ();




ai_features_config

create table public.ai_features_config (
  id uuid not null default gen_random_uuid (),
  feature_key text not null,
  model_name text null,
  prompt_template text null,
  temperature numeric null default 0.7,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint ai_features_config_pkey primary key (id),
  constraint ai_features_config_key_unique unique (feature_key)
) TABLESPACE pg_default;

create trigger update_ai_features_config_modtime BEFORE
update on ai_features_config for EACH row
execute FUNCTION update_modified_column ();




ai_dictionary_terms

create table public.ai_dictionary_terms (
  id uuid not null default gen_random_uuid (),
  term text not null,
  definition text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint ai_dictionary_terms_pkey primary key (id),
  constraint ai_dictionary_terms_term_key unique (term)
) TABLESPACE pg_default;

create trigger update_ai_dictionary_terms_modtime BEFORE
update on ai_dictionary_terms for EACH row
execute FUNCTION update_modified_column ();