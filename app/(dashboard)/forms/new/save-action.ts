'use server';

import { createClient } from '@/lib/supabase/server';
import { isClientUser } from '@/lib/auth/roles';
import { nanoid } from 'nanoid';
import { redirect } from 'next/navigation';
import type { AIFormSchema } from '@/types/form';
import { aiFieldsToFormFields } from '@/lib/ai-form-fields';

export async function saveGeneratedForm(schema: AIFormSchema) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Customers have accounts too, but only business owners may create forms
  if (!user || isClientUser(user)) throw new Error('Unauthorized');

  const slug = nanoid(10);

  const { data: form, error: formError } = await supabase
    .from('forms')
    .insert({
      user_id: user.id,
      title: schema.form_title,
      description: schema.form_description,
      slug,
    })
    .select()
    .single();

  if (formError || !form) throw new Error(formError?.message ?? 'Failed to create form');

  // Real ids are created here so that conditional fields (show_if) can point at each other
  const fields = aiFieldsToFormFields(schema.fields, form.id).map((field) => ({
    id: field.id,
    form_id: form.id,
    type: field.type,
    label: field.label,
    placeholder: field.placeholder ?? null,
    required: field.required,
    options: field.options ?? null,
    field_order: field.field_order,
    show_if: field.show_if ?? null,
  }));

  const { error: fieldsError } = await supabase.from('form_fields').insert(fields);
  if (fieldsError) throw new Error(fieldsError.message);

  redirect(`/forms/${form.id}/edit`);
}
