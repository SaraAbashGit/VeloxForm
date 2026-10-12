'use server';

import { isRateLimited, LIMITS, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';
import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isClientUser } from '@/lib/auth/roles';
import { generateSubmissionPdf } from '@/lib/pdf/generate-submission-pdf';
import { sendSubmissionNotification } from '@/lib/email';
import { APP_URL } from '@/lib/app-url';
import { uploadSignature, confirmUpload } from '@/lib/storage';
import type { Form, FormField, SubmissionAnswer } from '@/types/form';

// A failure the customer can understand; anything else is reported as a generic error
class SubmitError extends Error {}

export type SubmitResult = { ok: true; submissionId: string } | { ok: false; error: string };

// Returns a result instead of throwing: Next.js hides thrown messages from the browser in production
export async function submitForm(slug: string, rawData: Record<string, unknown>): Promise<SubmitResult> {
  const { limit, windowMs } = LIMITS.submitForm;
  if (isRateLimited('submitForm', limit, windowMs)) return { ok: false, error: RATE_LIMIT_MESSAGE };

  let createdSubmissionId: string | null = null;
  try {
    return await saveSubmission(slug, rawData, (id) => (createdSubmissionId = id));
  } catch (error) {
    console.error('Form submission failed:', error);
    // Don't leave a half-saved submission behind (answers are removed by ON DELETE CASCADE)
    if (createdSubmissionId) {
      await createServiceClient().from('submissions').delete().eq('id', createdSubmissionId);
    }
    return {
      ok: false,
      error: error instanceof SubmitError ? error.message : 'שגיאה בשליחת הטופס. נסו שוב בעוד רגע',
    };
  }
}

async function saveSubmission(
  slug: string,
  rawData: Record<string, unknown>,
  onCreated: (submissionId: string) => void
): Promise<SubmitResult> {
  const supabase = createServiceClient();

  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('*, form_fields(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (formError || !form) throw new SubmitError('הטופס לא נמצא או שאינו פעיל יותר');

  const fields = (form.form_fields as FormField[]).sort((a, b) => a.field_order - b.field_order);

  // Never trust the browser: re-check required fields and cap text length before saving anything
  const MAX_TEXT = 5000;
  for (const field of fields) {
    const raw = rawData[field.id];
    const isEmpty = raw === undefined || raw === null || raw === '' || raw === false || (Array.isArray(raw) && raw.length === 0);
    if (field.required && isEmpty) throw new SubmitError(`חסר שדה חובה: ${field.label}`);
    if (typeof raw === 'string' && field.type !== 'signature' && raw.length > MAX_TEXT) {
      throw new SubmitError(`התשובה ארוכה מדי בשדה: ${field.label}`);
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

  // A signed-in customer gets the submission linked to their account ("המסמכים שלי")
  const { data: { user } } = await (await createClient()).auth.getUser();
  const clientId = isClientUser(user) ? user!.id : null;

  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .insert({ form_id: form.id, snapshot_json: snapshot, ...(clientId ? { client_id: clientId } : {}) })
    .select()
    .single();

  if (subError || !submission) throw new Error(subError?.message ?? 'Submission failed');
  onCreated(submission.id);

  const answers: SubmissionAnswer[] = [];
  // The PDF embeds the signature image itself, so it gets the original data URL rather than the storage path
  const pdfAnswers: SubmissionAnswer[] = [];

  for (const field of fields) {
    let value = String(rawData[field.id] ?? '');
    let pdfValue = value;

    if (field.type === 'signature' && value.startsWith('data:image')) {
      value = await uploadSignature(value, submission.id, field.id).catch((error) => {
        console.error('Signature upload failed:', error);
        throw new SubmitError('שמירת החתימה נכשלה. נסו שוב');
      });
    } else if (field.type === 'file_upload' && value) {
      value = await confirmUpload(value).catch((error) => {
        console.error('File confirmation failed:', error);
        throw new SubmitError(`הקובץ בשדה "${field.label}" לא הועלה. נסו להעלות אותו שוב`);
      });
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

  const { data: owner } = await supabase
    .from('users')
    .select('email, business_name')
    .eq('id', form.user_id)
    .single();

  try {
    // pdf_url holds the private storage reference; the dashboard serves it after an ownership check
    const pdfRef = await generateSubmissionPdf(snapshot, pdfAnswers, submission.id, {
      businessName: owner?.business_name,
      submittedAt: submission.submitted_at,
    });
    await supabase.from('submissions').update({ pdf_url: pdfRef }).eq('id', submission.id);
  } catch (error) {
    console.error('PDF generation failed:', error); // best-effort: the submission itself is saved
  }


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

  // The customer's documents and the owner's lists must show the new submission without a manual refresh
  revalidatePath('/my');
  revalidatePath('/dashboard');
  revalidatePath('/submissions');
  revalidatePath(`/forms/${form.id}/submissions`);

  return { ok: true, submissionId: submission.id };
}
