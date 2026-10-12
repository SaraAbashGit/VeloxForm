import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicFormClient } from './PublicFormClient';
import { Logo } from '@/components/brand/Logo';
import { ClientBar } from '@/components/client/ClientBar';
import { clientName, isClientUser } from '@/lib/auth/roles';
import { linkClientToBusiness } from '@/lib/auth/client-businesses';
import type { Form, FormField } from '@/types/form';

// Submitting renders the PDF and sends email, which can exceed Vercel's default function timeout
export const maxDuration = 60;

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

  const { data: { user } } = await supabase.auth.getUser();
  const isClient = isClientUser(user);
  await linkClientToBusiness(user, form.user_id);
  const formFields = (fields ?? []) as FormField[];

  // A signed-in customer gets their name and email filled in (first matching field of each kind)
  const prefill: Record<string, string> = {};
  if (isClient && user) {
    const emailField = formFields.find((f) => f.type === 'email');
    if (emailField && user.email) prefill[emailField.id] = user.email;
    const nameField = formFields.find((f) => f.type === 'text' && f.label.includes('שם'));
    if (nameField) prefill[nameField.id] = clientName(user);
  }

  return (
    <div className="min-h-screen bg-surface">
      <ClientBar user={user} next={`/forms/${params.id}`} />
      <div className="py-8 px-4">
        <PublicFormClient form={form as Form} fields={formFields} prefill={prefill} isClient={isClient} />
      </div>
      <footer className="pb-8 flex justify-center items-center gap-2 text-xs text-muted-foreground">
        נוצר באמצעות
        <Logo size="sm" />
      </footer>
    </div>
  );
}
