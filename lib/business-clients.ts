import { createServiceClient } from '@/lib/supabase/admin';
import { linkedBusinessIds } from '@/lib/auth/client-businesses';
import { isClientUser } from '@/lib/auth/roles';

export interface BusinessClient {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  submissions: { id: string; formId: string; formTitle: string; submittedAt: string }[];
  lastActivity: string | null;
  /** Active forms of the business this customer has not submitted yet */
  missingForms: { id: string; title: string; slug: string }[];
}

/**
 * Registered customers of one business: linked through a business link, or who submitted one of its forms.
 * Server-only (service role); the caller must be the business owner.
 */
export async function getBusinessClients(businessId: string): Promise<BusinessClient[]> {
  const service = createServiceClient();

  const { data: forms } = await service
    .from('forms')
    .select('id, title, slug, is_active')
    .eq('user_id', businessId);
  const formIds = (forms ?? []).map((f) => f.id);
  const formTitle = Object.fromEntries((forms ?? []).map((f) => [f.id, f.title as string]));
  const activeForms = (forms ?? []).filter((f) => f.is_active);

  const { data: submissions } = formIds.length
    ? await service
        .from('submissions')
        .select('id, form_id, submitted_at, client_id')
        .in('form_id', formIds)
        .not('client_id', 'is', null)
        .order('submitted_at', { ascending: false })
    : { data: [] };

  // MVP scale: one page of users is enough; switch to a customers table when this grows
  const { data: usersPage } = await service.auth.admin.listUsers({ perPage: 1000 });
  const submitterIds = new Set((submissions ?? []).map((s) => s.client_id as string));
  const customers = (usersPage?.users ?? []).filter(
    (u) => isClientUser(u) && (linkedBusinessIds(u).includes(businessId) || submitterIds.has(u.id))
  );

  return customers
    .map((u) => {
      const own = (submissions ?? []).filter((s) => s.client_id === u.id);
      const submittedFormIds = new Set(own.map((s) => s.form_id));
      return {
        id: u.id,
        name: (u.user_metadata?.full_name as string | undefined) || u.email || 'לקוח',
        email: u.email ?? '',
        joinedAt: u.created_at,
        submissions: own.map((s) => ({
          id: s.id,
          formId: s.form_id,
          formTitle: formTitle[s.form_id] ?? 'טופס',
          submittedAt: s.submitted_at,
        })),
        lastActivity: own[0]?.submitted_at ?? null,
        missingForms: activeForms
          .filter((f) => !submittedFormIds.has(f.id))
          .map((f) => ({ id: f.id, title: f.title, slug: f.slug })),
      };
    })
    .sort((a, b) => (b.lastActivity ?? b.joinedAt).localeCompare(a.lastActivity ?? a.joinedAt));
}
