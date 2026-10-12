import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { SubmissionDocument } from '@/components/pdf/SubmissionDocument';
import { uploadPdf } from '@/lib/storage';
import { createServiceClient } from '@/lib/supabase/admin';
import type { Form, SubmissionAnswer } from '@/types/form';

/** Returns the storage reference ("pdfs/<id>.pdf"), not a public URL. Signature answers must be data URLs. */
export async function generateSubmissionPdf(
  form: Form,
  answers: SubmissionAnswer[],
  submissionId: string,
  details: { businessName?: string; submittedAt?: string } = {}
): Promise<string> {
  const buffer = await renderToBuffer(
    // SubmissionDocument renders a <Document>, which renderToBuffer expects as its root
    React.createElement(SubmissionDocument, {
      form,
      answers,
      submissionId,
      ...details,
    }) as unknown as React.ReactElement<DocumentProps>
  );
  return uploadPdf(buffer, submissionId);
}

/**
 * Builds the PDF again for an existing submission (e.g. when generation failed at submit time).
 * Stored signatures are downloaded and embedded. Caller must have verified the business owns it.
 */
export async function regenerateSubmissionPdf(submissionId: string): Promise<string> {
  const service = createServiceClient();
  const { data: submission, error } = await service
    .from('submissions')
    .select('id, submitted_at, snapshot_json, submission_answers(*), forms(user_id)')
    .eq('id', submissionId)
    .single();
  if (error || !submission) throw new Error('Submission not found');

  const form = submission.snapshot_json as Form;
  const ownerId = (submission.forms as unknown as { user_id: string } | null)?.user_id;
  const { data: owner } = ownerId
    ? await service.from('users').select('business_name').eq('id', ownerId).single()
    : { data: null };

  const answers = await Promise.all(
    (submission.submission_answers as SubmissionAnswer[]).map(async (answer) => {
      const value = answer.answer_value ?? '';
      if (!value.startsWith('signatures/')) return answer;
      const { data: image } = await service.storage.from('signatures').download(value.slice('signatures/'.length));
      if (!image) return { ...answer, answer_value: '' };
      const base64 = Buffer.from(await image.arrayBuffer()).toString('base64');
      return { ...answer, answer_value: `data:image/png;base64,${base64}` };
    })
  );

  const pdfRef = await generateSubmissionPdf(form, answers, submission.id, {
    businessName: owner?.business_name,
    submittedAt: submission.submitted_at,
  });
  await service.from('submissions').update({ pdf_url: pdfRef }).eq('id', submission.id);
  return pdfRef;
}
