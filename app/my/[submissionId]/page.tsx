import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSignedUrl, parseStoredFile } from '@/lib/storage';
import type { Form, FormField } from '@/types/form';

// A customer's own copy of a form they submitted (read-only). Only submissions linked to their account.
export default async function MySubmissionPage({ params }: { params: { submissionId: string } }) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return null; // layout redirects

  const service = createServiceClient();
  const { data: submission } = await service
    .from('submissions')
    .select('id, submitted_at, pdf_url, snapshot_json, submission_answers(field_id, answer_value), forms(user_id)')
    .eq('id', params.submissionId)
    .eq('client_id', user.id)
    .single();
  if (!submission) notFound();

  const form = submission.snapshot_json as Form;
  const fields = (form.form_fields ?? []) as FormField[];
  const answers = Object.fromEntries(
    (submission.submission_answers as { field_id: string; answer_value: string }[]).map((a) => [a.field_id, a.answer_value ?? ''])
  );
  const ownerId = (submission.forms as unknown as { user_id: string } | null)?.user_id;
  const { data: business } = ownerId
    ? await service.from('users').select('business_name').eq('id', ownerId).single()
    : { data: null };

  // The signature image is the customer's own; show it through a short-lived link
  const signatureUrls: Record<string, string | null> = {};
  for (const field of fields) {
    const value = answers[field.id] ?? '';
    if (field.type === 'signature' && value.startsWith('signatures/')) signatureUrls[field.id] = await getSignedUrl(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-brand-teal">{form.title}</h1>
          <p className="text-muted-foreground">
            {business?.business_name ?? 'עסק'} · נשלח {new Date(submission.submitted_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex gap-2">
          {submission.pdf_url && (
            <Button asChild>
              <a href={`/my/${submission.id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                הורדת PDF
              </a>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/my">חזרה למסמכים שלי</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">התשובות שלי</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => {
            const value = answers[field.id] ?? '';
            const file = field.type === 'file_upload' ? parseStoredFile(value) : null;
            return (
              <div key={field.id} className="border-b pb-4 last:border-0">
                <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                {field.type === 'signature' ? (
                  signatureUrls[field.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={signatureUrls[field.id]!} alt="החתימה שלי" className="mt-2 max-w-xs rounded border-2 border-dashed border-brand-sage bg-white p-2" />
                  ) : (
                    <p className="mt-1">—</p>
                  )
                ) : file ? (
                  <p className="mt-1 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-sage" />
                    {file.name}
                  </p>
                ) : (
                  <p className="mt-1">{value || '—'}</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
