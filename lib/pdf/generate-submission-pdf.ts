import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { SubmissionDocument } from '@/components/pdf/SubmissionDocument';
import { uploadPdf } from '@/lib/storage';
import type { Form, SubmissionAnswer } from '@/types/form';

/** Returns the storage reference ("pdfs/<id>.pdf"), not a public URL */
export async function generateSubmissionPdf(
  form: Form,
  answers: SubmissionAnswer[],
  submissionId: string
): Promise<string> {
  const buffer = await renderToBuffer(
    // SubmissionDocument renders a <Document>, which renderToBuffer expects as its root
    React.createElement(SubmissionDocument, { form, answers }) as unknown as React.ReactElement<DocumentProps>
  );
  return uploadPdf(buffer, submissionId);
}
