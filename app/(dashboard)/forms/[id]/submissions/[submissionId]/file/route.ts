import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { parseStoredFile } from '@/lib/storage';

// Serves a customer's uploaded file from our own domain (filtered networks block storage downloads).
// Ownership is checked with the business owner's own session (RLS) before the service role reads the file.
export async function GET(request: Request, { params }: { params: { id: string; submissionId: string } }) {
  const fieldId = new URL(request.url).searchParams.get('field');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !fieldId) return new NextResponse('Not found', { status: 404 });

  const { data: submission } = await supabase
    .from('submissions')
    .select('id, forms!inner(user_id), submission_answers(field_id, answer_value)')
    .eq('id', params.submissionId)
    .eq('form_id', params.id)
    .eq('forms.user_id', user.id)
    .single();
  const answer = (submission?.submission_answers as { field_id: string; answer_value: string }[] | undefined)?.find(
    (a) => a.field_id === fieldId
  );
  const file = answer ? parseStoredFile(answer.answer_value) : null;
  if (!file || !file.ref.startsWith('uploads/')) return new NextResponse('Not found', { status: 404 });

  const { data, error } = await createServiceClient().storage.from('uploads').download(file.ref.slice('uploads/'.length));
  if (error || !data) return new NextResponse('הקובץ לא זמין כרגע', { status: 503 });

  return new Response(data, {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      // RFC 5987 so Hebrew file names survive
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
