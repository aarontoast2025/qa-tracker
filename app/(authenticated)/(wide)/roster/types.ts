export interface Employee {
  id: string;
  eid: string;
  case_safe_id: string;
  toasttab_email: string;
  location: string;
  last_name: string;
  first_name: string;
  middle_name?: string;
  skill: string;
  channel: string;
  tier: string;
  role: string;
  status: string;
  wave: string;
  production_date: string | null;
  supervisor: string;
  manager: string;
  tenure: number | null;
  tenure_bucket: string;
  created_at: string;
  updated_at: string;
}

export type EmployeeInput = Omit<Employee, 'id' | 'created_at' | 'updated_at'>;

export interface RosterMetadata {
  roles: string[];
  locations: string[];
  skills: string[];
  channels: string[];
  tiers: string[];
  waves: string[];
  statuses: string[];
  supervisors: string[];
  managers: string[];
}