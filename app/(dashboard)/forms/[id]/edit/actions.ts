'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { FormField } from '@/types/form';

export async function saveFormFields(formId: string, fields: FormField[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('id', formId)
    .eq('user_id', user.id)
    .single();

  if (!form) throw new Error('Form not found');

  // Ids come from the browser and are interpolated into the delete filter below, so accept UUIDs only
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (fields.some((f) => !UUID.test(f.id))) throw new Error('Invalid field id');

  const rows = fields.map((f, i) => ({
    id: f.id,
    form_id: formId,
    type: f.type,
    label: f.label,
    placeholder: f.placeholder ?? null,
    required: f.required,
    options: f.options ?? null,
    default_value: f.default_value ?? null,
    field_order: i,
  }));

  // Update in place (ids stay stable) instead of delete-all + insert, so existing answers keep their field ids
  const { error } = await supabase.from('form_fields').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(error.message);

  // Remove only the fields the user deleted. Old submissions keep their own copy in snapshot_json.
  const keepIds = rows.map((r) => r.id);
  let removeQuery = supabase.from('form_fields').delete().eq('form_id', formId);
  if (keepIds.length > 0) removeQuery = removeQuery.not('id', 'in', `(${keepIds.join(',')})`);
  const { error: removeError } = await removeQuery;
  if (removeError) throw new Error(removeError.message);

  revalidatePath(`/forms/${formId}/edit`);
  return { success: true };
}

export async function updateFormMeta(
  formId: string,
  meta: { title?: string; description?: string; is_active?: boolean }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('forms')
    .update(meta)
    .eq('id', formId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/forms/${formId}/edit`);
  return { success: true };
}
