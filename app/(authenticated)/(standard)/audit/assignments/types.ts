export interface Specialist {
  id: string;
  first_name: string | null;
  last_name: string | null;
  eid: string | null;
  skill: string | null;
  supervisor: string | null;
  role: string | null;
  status: string | null;
}

export interface QA {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_email: string | null;
  user_roles?: { name: string } | null;
}

export interface Form {
  id: string;
  title: string;
}

export interface Assignment {
  id: string;
  qa_id: string;
  specialist_id: string;
  form_id: string | null;
  status: string;
  assignment_date: string | null;
  created_at: string;
  qa: { first_name: string | null; last_name: string | null } | null;
  specialist: { first_name: string | null; last_name: string | null; eid: string | null } | null;
  form: { title: string } | null;
}
