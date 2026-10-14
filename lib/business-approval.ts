import { createHmac, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/admin';
import { businessStatus, type BusinessStatus } from '@/lib/auth/roles';
import { sendBusinessWelcome } from '@/lib/email';
import { APP_URL } from '@/lib/app-url';

// Server-only secret for signing approval links; the service role key is secret and always set
const SECRET = process.env.APPROVAL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** The secret code in the admin's email link. It can't be guessed without the server secret. */
export function approvalToken(businessId: string): string {
  return createHmac('sha256', SECRET).update(`approve-business:${businessId}`).digest('hex');
}

export function isValidApprovalToken(businessId: string, token: unknown): boolean {
  if (!SECRET || typeof token !== 'string') return false;
  const expected = Buffer.from(approvalToken(businessId));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function approvalUrl(businessId: string): string {
  return `${APP_URL}/approve/${businessId}?t=${approvalToken(businessId)}`;
}

export interface BusinessDetails {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  emailConfirmed: boolean;
  status: BusinessStatus;
}

export async function getBusinessDetails(businessId: string): Promise<BusinessDetails | null> {
  const service = createServiceClient();
  const { data } = await service.auth.admin.getUserById(businessId);
  const user = data?.user;
  if (!user || user.user_metadata?.role === 'client') return null;

  const { data: profile } = await service.from('users').select('business_name').eq('id', businessId).maybeSingle();
  return {
    id: user.id,
    name: profile?.business_name ?? user.user_metadata?.business_name ?? user.email ?? 'ללא שם',
    email: user.email ?? '',
    createdAt: user.created_at,
    emailConfirmed: !!user.email_confirmed_at,
    status: businessStatus(user),
  };
}

/** Approves or rejects a business. Callers must check permission first (admin session or a valid link). */
export async function applyBusinessStatus(businessId: string, status: Exclude<BusinessStatus, 'pending'>) {
  const service = createServiceClient();
  const { data } = await service.auth.admin.getUserById(businessId);
  const business = data?.user;
  if (!business || business.user_metadata?.role === 'client') return;
  const wasApproved = business.app_metadata?.business_status === 'approved';

  const { error } = await service.auth.admin.updateUserById(businessId, {
    app_metadata: { ...business.app_metadata, business_status: status },
  });
  if (error) throw new Error(error.message);

  if (status === 'approved' && !wasApproved && business.email) {
    const { data: profile } = await service.from('users').select('business_name').eq('id', businessId).maybeSingle();
    await sendBusinessWelcome({
      businessEmail: business.email,
      businessName: profile?.business_name ?? business.email,
      loginUrl: `${APP_URL}/login`,
      createdByAdmin: false,
    });
  }
}
