'use server';

import { createServiceClient } from '@/lib/supabase/admin';
import { generateSubmissionPdf } from '@/lib/pdf/generate-submission-pdf';
import { sendSubmissionNotification } from '@/lib/email';
import { uploadSignature, uploadFile } from '@/lib/storage';
import type { Form, FormField, SubmissionAnswer } from '@/types/form';

export async function submitForm(slug: string, rawData: Record<string, unknown>) {
  const supabase = createServiceClient();

  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('*, form_fields(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (formError || !form) throw new Error('Form not found');

  const fields = (form.form_fields as FormField[]).sort((a, b) => a.field_order - b.field_order);
  const snapshot: Form = {
    id: form.id,
    user_id: form.user_id,
    title: form.title,
    description: form.description,
    slug: form.slug,
    is_active: form.is_active,
    created_at: form.created_at,
    form_fields: fields,
  };

  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .insert({ form_id: form.id, snapshot_json: snapshot })
    .select()
    .single();

  if (subError || !submission) throw new Error(subError?.message ?? 'Submission failed');

  const answers: SubmissionAnswer[] = [];

  for (const field of fields) {
    let value = String(rawData[field.id] ?? '');

    if (field.type === 'signature' && value.startsWith('data:image')) {
      value = await uploadSignature(value, submission.id, field.id);
    } else if (field.type === 'file_upload' && value) {
      value = await uploadFile(value, submission.id, field.id);
    } else if (field.type === 'checkbox' && Array.isArray(rawData[field.id])) {
      value = (rawData[field.id] as string[]).join(', ');
    }

    const { data: answer, error: ansError } = await supabase
      .from('submission_answers')
      .insert({
        submission_id: submission.id,
        field_id: field.id,
        answer_value: value,
      })
      .select()
      .single();

    if (ansError) throw new Error(ansError.message);
    answers.push(answer as SubmissionAnswer);
  }

  let pdfUrl: string | undefined;
  try {
    pdfUrl = await generateSubmissionPdf(snapshot, answers, submission.id);
    await supabase.from('submissions').update({ pdf_url: pdfUrl }).eq('id', submission.id);
  } catch {
    // PDF generation is best-effort
  }

  const { data: owner } = await supabase
    .from('users')
    .select('email')
    .eq('id', form.user_id)
    .single();

  if (owner?.email) {
    try {
      await sendSubmissionNotification({
        businessEmail: owner.email,
        formTitle: form.title,
        submissionId: submission.id,
        dashboardUrl: process.env.NEXT_PUBLIC_APP_URL!,
      });
    } catch {
      // Email is best-effort
    }
  }

  return { success: true, submissionId: submission.id };
}
