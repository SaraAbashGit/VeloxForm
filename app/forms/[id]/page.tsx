import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicFormClient } from './PublicFormClient';
import { Logo } from '@/components/brand/Logo';
import type { Form, FormField } from '@/types/form';

export default async function PublicFormPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq('slug', params.id) // [id] here holds the public slug (shares the segment name with (dashboard)/forms/[id])
    .eq('is_active', true)
    .single();

  if (!form) notFound();

  const { data: fields } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', form.id)
    .order('field_order');

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <PublicFormClient form={form as Form} fields={(fields ?? []) as FormField[]} />
      <footer className="mt-8 flex justify-center items-center gap-2 text-xs text-muted-foreground">
        נוצר באמצעות
        <Logo size="sm" />
      </footer>
    </div>
  );
}
