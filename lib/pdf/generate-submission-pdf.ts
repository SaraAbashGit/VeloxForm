import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { SubmissionDocument } from '@/components/pdf/SubmissionDocument';
import { createServiceClient } from '@/lib/supabase/admin';
import type { Form, SubmissionAnswer } from '@/types/form';

export async function generateSubmissionPdf(
  form: Form,
  answers: SubmissionAnswer[],
  submissionId: string
): Promise<string> {
  const buffer = await renderToBuffer(
    React.createElement(SubmissionDocument, { form, answers })
  );

  const supabase = createServiceClient();
  const fileName = `${submissionId}.pdf`;

  const { error } = await supabase.storage
    .from('pdfs')
    .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('pdfs').getPublicUrl(fileName);
  return data.publicUrl;
}
