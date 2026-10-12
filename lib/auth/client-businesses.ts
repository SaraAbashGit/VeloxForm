import type { User } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/admin';
import { isClientUser } from '@/lib/auth/roles';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The businesses a customer is connected to live in app_metadata.business_ids.
// app_metadata can only be written with the service role, so a customer cannot edit the list themselves.
export function linkedBusinessIds(user: User | null | undefined): string[] {
  const ids = user?.app_metadata?.business_ids;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

export async function linkClientToBusiness(user: User | null | undefined, businessId: string | null) {
  if (!user || !isClientUser(user) || !businessId || !UUID.test(businessId)) return;
  const current = linkedBusinessIds(user);
  if (current.includes(businessId)) return;

  await createServiceClient().auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, business_ids: [...current, businessId] },
  });
}

/** Which business a link points to: /b/<businessId> or /forms/<slug> */
export async function businessIdFromPath(path: string): Promise<string | null> {
  const businessPage = path.match(/^\/b\/([0-9a-f-]{36})/i);
  if (businessPage) return businessPage[1];

  const formPage = path.match(/^\/forms\/([^/?#]+)/);
  if (!formPage) return null;
  const { data } = await createServiceClient()
    .from('forms')
    .select('user_id')
    .eq('slug', formPage[1])
    .single();
  return data?.user_id ?? null;
}
