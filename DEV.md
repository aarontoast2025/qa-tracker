Database Schema
Table: audit_evaluations_assigned
Extends the structure of audit_evaluations table, you can add necessary columns if needed

Designed for authenticated users (QAs) to manage their assigned audits
Tracks assignment status, assigned specialists, and evaluation progress

Required Pages
1. Assignment Manager page
Purpose: Administrative interface for supervisors/managers to assign specialists to QAs

Key Features:
Select one or multiple specialists from a list
Assign selected specialists to specific QAs
View assignment history and current workload per QA
Bulk assignment capabilities
Use the list of specialist in roster_employees table

2. Assignment Dashboard 
Purpose: QAs view their owned assigned specialist and track progress

Let's work on the QA Dashboard page, change the name to Assignment Dashboard.
There should be a Daily/Weekly/Monthly view similar to the Assignment Manager
Remove the 'Start' button. 
Remove the Due Date date there.
Make the list a table, with pagination as well.
In the audit_evaluations_assigned add this columns:
  call_ani,
  case_number,
  call_duration,
  date_interaction,
  case_category,
  issue_concern,
  form_data (this is the jsonb to be stored the values of the form),
  status,
  qa_score,
Add the name of the Supervisor (this is in case there is a change in supervisor, the record is still intact with that supervisor).
The audit_evaluations_assigned is the table to be used in this page.


3. Evaluation Form page
Purpose: QAs complete and submit their audit evaluations
Key Features:
Dynamic form based on the existing tables for forms
Save draft functionality
Submit final evaluation
Validation to ensure all required fields are completed
Use the table audit_evaluations_assigned to submit records














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



  call_ani,
  case_number,
  call_duration,
  date_interaction,
  case_category,
  issue_concern,
  form_data,
  status,
  qa_score,


audit_evaluations_assigned

create table public.audit_evaluations_assigned (
  id uuid not null default gen_random_uuid (),
  qa_id uuid not null,
  specialist_id uuid not null,
  form_id uuid null,
  status text not null default 'pending'::text,
  assigned_by uuid null default auth.uid (),
  evaluation_id uuid null,
  assignment_date date null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint audit_evaluations_assigned_pkey primary key (id),
  constraint audit_evaluations_assigned_evaluation_id_fkey foreign KEY (evaluation_id) references audit_evaluations (id) on delete set null,
  constraint audit_evaluations_assigned_form_id_fkey foreign KEY (form_id) references form_templates (id) on delete set null,
  constraint audit_evaluations_assigned_qa_id_fkey foreign KEY (qa_id) references user_profiles (id) on delete CASCADE,
  constraint audit_evaluations_assigned_specialist_id_fkey foreign KEY (specialist_id) references roster_employees (id) on delete CASCADE,
  constraint audit_evaluations_assigned_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'in-progress'::text,
          'completed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_audit_assignments_qa_id on public.audit_evaluations_assigned using btree (qa_id) TABLESPACE pg_default;

create index IF not exists idx_audit_assignments_specialist_id on public.audit_evaluations_assigned using btree (specialist_id) TABLESPACE pg_default;

create index IF not exists idx_audit_assignments_assignment_date on public.audit_evaluations_assigned using btree (assignment_date) TABLESPACE pg_default;

create index IF not exists idx_audit_assignments_status on public.audit_evaluations_assigned using btree (status) TABLESPACE pg_default;

create trigger update_audit_evaluations_assigned_modtime BEFORE
update on audit_evaluations_assigned for EACH row
execute FUNCTION update_modified_column ();