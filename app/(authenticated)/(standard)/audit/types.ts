export interface AuditForm {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type AuditFormInput = Omit<AuditForm, 'id' | 'created_by' | 'created_at' | 'updated_at'>;

export interface AuditGroup {
  id: string;
  form_id: string;
  title: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  items?: AuditItem[];
}

export type AuditGroupInput = Omit<AuditGroup, 'id' | 'created_at' | 'updated_at' | 'items'>;

export interface AuditItem {
  id: string;
  group_id: string;
  question_text: string;
  short_name: string | null;
  item_type: 'toggle_yes_no' | 'toggle_custom' | 'dropdown_custom';
  is_required: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  options?: AuditItemOption[];
}

export type AuditItemInput = Omit<AuditItem, 'id' | 'created_at' | 'updated_at' | 'options'>;

export interface AuditItemOption {
  id: string;
  item_id: string;
  label: string;
  value: string | null;
  is_default: boolean;
  is_correct: boolean;
  color: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  feedback_general?: { feedback_text: string }[];
  feedback_tags?: { id: string; tag_label: string; feedback_text: string }[];
}

export type AuditItemOptionInput = Omit<AuditItemOption, 'id' | 'created_at' | 'updated_at'>;
