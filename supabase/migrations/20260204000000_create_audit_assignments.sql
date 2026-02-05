-- Create audit_evaluations_assigned table
create table public.audit_evaluations_assigned (
  id uuid not null default gen_random_uuid (),
  qa_id uuid not null,
  specialist_id uuid not null,
  form_id uuid null,
  status text not null default 'pending'::text,
  assigned_by uuid null default auth.uid (),
  evaluation_id uuid null,
  due_date date null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint audit_evaluations_assigned_pkey primary key (id),
  constraint audit_evaluations_assigned_qa_id_fkey foreign KEY (qa_id) references user_profiles (id) on delete CASCADE,
  constraint audit_evaluations_assigned_specialist_id_fkey foreign KEY (specialist_id) references roster_employees (id) on delete CASCADE,
  constraint audit_evaluations_assigned_form_id_fkey foreign KEY (form_id) references form_templates (id) on delete set null,
  constraint audit_evaluations_assigned_evaluation_id_fkey foreign KEY (evaluation_id) references audit_evaluations (id) on delete set null,
  constraint audit_evaluations_assigned_status_check check (
    (
      status = any (
        array['pending'::text, 'in-progress'::text, 'completed'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- Create trigger for updated_at
create trigger update_audit_evaluations_assigned_modtime BEFORE
update on audit_evaluations_assigned for EACH row
execute FUNCTION update_modified_column ();

-- Enable RLS
alter table public.audit_evaluations_assigned enable row level security;

-- Add new permissions
insert into public.user_permissions (name, code, group_name, description)
values 
  ('View Assignments', 'assignments.view', 'Audit Assignments', 'Ability to view assigned audits'),
  ('Manage Assignments', 'assignments.manage', 'Audit Assignments', 'Ability to assign audits to specialists and QAs')
on conflict (code) do update set
  name = excluded.name,
  group_name = excluded.group_name,
  description = excluded.description;

-- RLS Policies

-- 1. Users can view assignments assigned to them OR if they have assignments.manage permission
create policy "Users can view their own assignments or managers can view all"
  on public.audit_evaluations_assigned
  for select
  to authenticated
  using (
    (qa_id = auth.uid()) OR 
    has_permission('assignments.manage')
  );

-- 2. Only users with assignments.manage can insert assignments
create policy "Managers can insert assignments"
  on public.audit_evaluations_assigned
  for insert
  to authenticated
  with check (
    has_permission('assignments.manage')
  );

-- 3. Users can update status of assignments assigned to them OR managers can update anything
create policy "Users can update their own assignments or managers can update all"
  on public.audit_evaluations_assigned
  for update
  to authenticated
  using (
    (qa_id = auth.uid()) OR 
    has_permission('assignments.manage')
  )
  with check (
    (qa_id = auth.uid()) OR 
    has_permission('assignments.manage')
  );

-- 4. Only managers can delete assignments
create policy "Managers can delete assignments"
  on public.audit_evaluations_assigned
  for delete
  to authenticated
  using (
    has_permission('assignments.manage')
  );
