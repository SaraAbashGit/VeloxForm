'use server';

import { revalidatePath } from 'next/cache';
import { applyBusinessStatus, isValidApprovalToken } from '@/lib/business-approval';

// Called from the admin's email link: the signed token stands in for an admin login
export async function decideFromEmail(businessId: string, token: string, status: 'approved' | 'rejected') {
  if (!isValidApprovalToken(businessId, token)) throw new Error('Invalid link');
  await applyBusinessStatus(businessId, status);
  revalidatePath(`/approve/${businessId}`);
  revalidatePath('/admin');
}
