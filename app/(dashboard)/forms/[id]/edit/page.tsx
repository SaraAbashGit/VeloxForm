import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { EditFormClient } from './EditFormClient';
import type { Form, FormField } from '@/types/form';

export default async function EditFormPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user?.id)
    .single();

  if (!form) notFound();

  const { data: fields } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', params.id)
    .order('field_order');

  return (
    <EditFormClient
      form={form as Form}
      fields={(fields ?? []) as FormField[]}
    />
  );
}
