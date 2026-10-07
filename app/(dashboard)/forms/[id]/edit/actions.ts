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

  await supabase.from('form_fields').delete().eq('form_id', formId);

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

  const { error } = await supabase.from('form_fields').insert(rows);
  if (error) throw new Error(error.message);

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
