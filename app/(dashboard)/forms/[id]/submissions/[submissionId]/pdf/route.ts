import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSignedUrl } from '@/lib/storage';

// The PDF bucket is private: check ownership with the user's own session, then redirect to a short-lived signed URL
export async function GET(_request: Request, { params }: { params: { id: string; submissionId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: submission } = await supabase
    .from('submissions')
    .select('id, pdf_url, forms!inner(user_id)')
    .eq('id', params.submissionId)
    .eq('form_id', params.id)
    .eq('forms.user_id', user.id)
    .single();

  if (!submission?.pdf_url) return new NextResponse('Not found', { status: 404 });

  const url = await getSignedUrl(submission.pdf_url, `submission-${submission.id}.pdf`);
  if (!url) return new NextResponse('Not found', { status: 404 });
  return NextResponse.redirect(url);
}
