'use server';

import { createClient } from '@/lib/supabase/server';
import { isClientUser } from '@/lib/auth/roles';
import { nanoid } from 'nanoid';
import { redirect } from 'next/navigation';
import type { AIFormSchema } from '@/types/form';

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

  const fields = schema.fields.map((field, index) => ({
    form_id: form.id,
    type: field.type,
    label: field.label,
    placeholder: field.placeholder ?? null,
    required: field.required,
    options: field.options ?? null,
    field_order: index,
  }));

  const { error: fieldsError } = await supabase.from('form_fields').insert(fields);
  if (fieldsError) throw new Error(fieldsError.message);

  redirect(`/forms/${form.id}/edit`);
}
