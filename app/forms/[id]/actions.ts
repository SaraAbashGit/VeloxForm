'use server';

import { createServiceClient } from '@/lib/supabase/admin';
import { generateSubmissionPdf } from '@/lib/pdf/generate-submission-pdf';
import { sendSubmissionNotification } from '@/lib/email';
import { APP_URL } from '@/lib/app-url';
import { uploadSignature, confirmUpload } from '@/lib/storage';
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

  // Never trust the browser: re-check required fields and cap text length before saving anything
  const MAX_TEXT = 5000;
  for (const field of fields) {
    const raw = rawData[field.id];
    const isEmpty = raw === undefined || raw === null || raw === '' || raw === false || (Array.isArray(raw) && raw.length === 0);
    if (field.required && isEmpty) throw new Error(`Missing required field: ${field.label}`);
    if (typeof raw === 'string' && field.type !== 'signature' && raw.length > MAX_TEXT) {
      throw new Error(`Field too long: ${field.label}`);
    }
  }
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
  // The PDF embeds the signature image itself, so it gets the original data URL rather than the storage path
  const pdfAnswers: SubmissionAnswer[] = [];

  for (const field of fields) {
    let value = String(rawData[field.id] ?? '');
    let pdfValue = value;

    if (field.type === 'signature' && value.startsWith('data:image')) {
      value = await uploadSignature(value, submission.id, field.id);
    } else if (field.type === 'file_upload' && value) {
      value = await confirmUpload(value);
      pdfValue = value;
    } else if (field.type === 'checkbox' && Array.isArray(rawData[field.id])) {
      value = (rawData[field.id] as string[]).join(', ');
      pdfValue = value;
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
    pdfAnswers.push({ ...(answer as SubmissionAnswer), answer_value: pdfValue });
  }

  try {
    // pdf_url holds the private storage reference; the dashboard signs it on demand
    const pdfRef = await generateSubmissionPdf(snapshot, pdfAnswers, submission.id);
    await supabase.from('submissions').update({ pdf_url: pdfRef }).eq('id', submission.id);
  } catch (error) {
    console.error('PDF generation failed:', error); // best-effort: the submission itself is saved
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
        formId: form.id,
        submissionId: submission.id,
        dashboardUrl: APP_URL,
      });
    } catch {
      // Email is best-effort
    }
  }

  return { success: true, submissionId: submission.id };
}
