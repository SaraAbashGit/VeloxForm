import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import type { Form, FormField } from '@/types/form';

export default async function SubmissionDetailPage({
  params,
}: {
  params: { id: string; submissionId: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user?.id)
    .single();

  if (!form) notFound();

  const { data: submission } = await supabase
    .from('submissions')
    .select('*, submission_answers(*)')
    .eq('id', params.submissionId)
    .eq('form_id', params.id)
    .single();

  if (!submission) notFound();

  const snapshot = submission.snapshot_json as Form;
  const fields = (snapshot.form_fields ?? []) as FormField[];
  const answers = Object.fromEntries(
    (submission.submission_answers ?? []).map(
      (a: { field_id: string; answer_value: string }) => [a.field_id, a.answer_value]
    )
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">פרטי הגשה</h1>
        <div className="flex gap-2">
          {submission.pdf_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={submission.pdf_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 me-1" />
                הורד PDF
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/forms/${params.id}/submissions`}>חזרה</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{snapshot.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {new Date(submission.submitted_at).toLocaleString('he-IL')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => {
            const value = answers[field.id] ?? '';
            const isSignature = field.type === 'signature' && value.startsWith('http');

            return (
              <div key={field.id} className="border-b pb-4 last:border-0">
                <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                {isSignature ? (
                  <img src={value} alt="חתימה" className="mt-2 max-w-xs border rounded" />
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
