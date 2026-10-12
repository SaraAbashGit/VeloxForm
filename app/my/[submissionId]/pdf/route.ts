import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { pdfResponse } from '@/lib/storage';

// A customer may download only PDFs of submissions linked to their own account
export async function GET(_request: Request, { params }: { params: { submissionId: string } }) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: submission } = await createServiceClient()
    .from('submissions')
    .select('id, pdf_url')
    .eq('id', params.submissionId)
    .eq('client_id', user.id)
    .single();

  if (!submission?.pdf_url) return new NextResponse('Not found', { status: 404 });
  return pdfResponse(submission.pdf_url, `document-${submission.id}.pdf`);
}
