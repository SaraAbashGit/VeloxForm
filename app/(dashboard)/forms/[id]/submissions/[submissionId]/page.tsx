import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import type { Form, FormField } from '@/types/form';
import { getSignedUrl, parseStoredFile } from '@/lib/storage';

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

  // Usually a link from a notification email opened while signed in to a different business account
  if (!form) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>ההגשה לא נמצאה בחשבון הזה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            את מחוברת כרגע בתור <b className="text-brand-teal" dir="ltr">{user?.email}</b>, וההגשה הזו שייכת לחשבון עסק אחר.
          </p>
          <p>כדי לראות אותה: בתפריט הצד לחצי התנתק, והתחברי עם החשבון של העסק שקיבל את ההגשה.</p>
          <Button asChild variant="outline">
            <Link href="/dashboard">ללוח הבקרה</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

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

  // Signatures and files live in private storage; ownership was checked above, so sign short-lived links
  const fileLinks: Record<string, { name: string; url: string | null }> = {};
  for (const field of fields) {
    const value: string = answers[field.id] ?? '';
    if (field.type === 'signature' && value.startsWith('signatures/')) {
      fileLinks[field.id] = { name: 'חתימה', url: await getSignedUrl(value) };
    } else if (field.type === 'file_upload') {
      const file = parseStoredFile(value);
      // Served through our own route, not a storage link: some networks block storage downloads
      if (file) fileLinks[field.id] = { name: file.name, url: `/forms/${params.id}/submissions/${params.submissionId}/file?field=${field.id}` };
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">פרטי הגשה</h1>
        <div className="flex gap-2">
          {submission.pdf_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/forms/${params.id}/submissions/${submission.id}/pdf`} target="_blank" rel="noopener noreferrer">
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
            const link = fileLinks[field.id];

            return (
              <div key={field.id} className="border-b pb-4 last:border-0">
                <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                {field.type === 'signature' && link?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.url} alt="חתימה" className="mt-2 max-w-xs rounded border-2 border-dashed border-brand-sage bg-white p-2" />
                ) : field.type === 'file_upload' && link ? (
                  link.url ? (
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-2 text-brand-cyan-700 hover:underline">
                      <ExternalLink className="h-4 w-4" />
                      {link.name}
                    </a>
                  ) : (
                    <p className="mt-1">{link.name}</p>
                  )
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
