'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { regenerateSubmissionPdf } from '@/lib/pdf/generate-submission-pdf';

/** Business owner action: create the PDF again for a submission whose PDF is missing */
export async function regeneratePdf(formId: string, submissionId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'יש להתחבר' };

  // Ownership check with the owner's own session (RLS) before using the service role
  const { data: submission } = await supabase
    .from('submissions')
    .select('id, forms!inner(user_id)')
    .eq('id', submissionId)
    .eq('form_id', formId)
    .eq('forms.user_id', user.id)
    .single();
  if (!submission) return { ok: false, error: 'ההגשה לא נמצאה' };

  try {
    await regenerateSubmissionPdf(submissionId);
  } catch (error) {
    console.error('PDF regeneration failed:', error);
    // The caller owns this submission, so the technical reason is safe to show and helps diagnose it
    const reason = error instanceof Error ? error.message.slice(0, 150) : '';
    return { ok: false, error: `יצירת ה-PDF נכשלה${reason ? `: ${reason}` : ''}` };
  }
  revalidatePath(`/forms/${formId}/submissions`);
  return { ok: true };
}
