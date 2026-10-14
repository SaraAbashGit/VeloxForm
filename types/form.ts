export type FieldType =
  | 'text' | 'textarea' | 'number' | 'email' | 'phone'
  | 'checkbox' | 'radio' | 'select' | 'date' | 'signature' | 'file_upload';

export interface FormField {
  id: string;
  form_id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  default_value?: string;
  field_order: number;
  /** Show the field only when another field has a given answer (null/undefined = always shown) */
  show_if?: FieldCondition | null;
}

export interface FieldCondition {
  field_id: string;
  equals: string;
}

export interface Form {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  form_fields?: FormField[];
}

export interface Submission {
  id: string;
  form_id: string;
  submitted_at: string;
  pdf_url?: string;
  snapshot_json: Form;
  submission_answers?: SubmissionAnswer[];
}

export interface SubmissionAnswer {
  id: string;
  submission_id: string;
  field_id: string;
  answer_value: string;
}

export interface AIFormSchema {
  form_title: string;
  form_description: string;
  fields: {
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    /** The AI's own name for the field, so conditions can point at fields that have no id yet */
    key?: string;
    show_if?: { key: string; equals: string } | null;
  }[];
}
