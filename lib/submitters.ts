import { createServiceClient } from '@/lib/supabase/admin';
import type { Form } from '@/types/form';

interface SubmissionRef {
  id: string;
  client_id?: string | null;
  snapshot_json?: unknown;
}

/**
 * Who filled each submission, for the business's lists: the customer's account name when they were
 * signed in, otherwise the answer of the form's first "name" text field. Caller must own the submissions.
 */
export async function submitterNames(submissions: SubmissionRef[]): Promise<Record<string, string>> {
  const service = createServiceClient();
  const names: Record<string, string> = {};

  const clientIds = Array.from(new Set(submissions.map((s) => s.client_id).filter((id): id is string => !!id)));
  const clientNames: Record<string, string> = {};
  await Promise.all(
    clientIds.map(async (id) => {
      const { data } = await service.auth.admin.getUserById(id);
      const name = (data.user?.user_metadata?.full_name as string | undefined) || data.user?.email;
      if (name) clientNames[id] = name;
    })
  );

  // For anonymous submissions, read the answer of the first text field whose label mentions a name
  const nameFieldBySubmission: Record<string, string> = {};
  for (const s of submissions) {
    if (s.client_id && clientNames[s.client_id]) {
      names[s.id] = clientNames[s.client_id];
      continue;
    }
    const fields = (s.snapshot_json as Form | undefined)?.form_fields ?? [];
    const nameField = fields.find((f) => f.type === 'text' && f.label.includes('שם')) ?? fields.find((f) => f.type === 'text');
    if (nameField) nameFieldBySubmission[s.id] = nameField.id;
  }

  const pending = Object.keys(nameFieldBySubmission);
  if (pending.length > 0) {
    const { data: answers } = await service
      .from('submission_answers')
      .select('submission_id, field_id, answer_value')
      .in('submission_id', pending);
    for (const a of answers ?? []) {
      if (nameFieldBySubmission[a.submission_id] === a.field_id && a.answer_value) {
        names[a.submission_id] = a.answer_value;
      }
    }
  }

  return names;
}
