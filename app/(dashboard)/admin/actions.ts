'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { isAdminUser, type BusinessStatus } from '@/lib/auth/roles';
import { sendBusinessWelcome } from '@/lib/email';
import { APP_URL } from '@/lib/app-url';
import type { AuthState } from '@/app/(auth)/actions';
import { applyBusinessStatus } from '@/lib/business-approval';

// Every admin action re-checks the caller: server actions can be called directly, not only from the page
async function assertAdmin() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!isAdminUser(user)) throw new Error('Not allowed');
}

export async function setBusinessStatus(businessId: string, status: Exclude<BusinessStatus, 'pending'>) {
  await assertAdmin();
  await applyBusinessStatus(businessId, status);
  revalidatePath('/admin');
}

const createSchema = z.object({
  business_name: z.string().trim().min(2, 'נא להזין שם עסק').max(100),
  email: z.string().trim().email('כתובת מייל לא תקינה'),
  password: z.string().min(6, 'הסיסמה צריכה להכיל לפחות 6 תווים').max(72),
});

/** A business opened by the admin is approved right away and skips email verification */
export async function createBusiness(_prev: AuthState, formData: FormData): Promise<AuthState> {
  await assertAdmin();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { business_name, email, password } = parsed.data;

  // The signup trigger creates the business profile row from user_metadata.business_name
  const { error } = await createServiceClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { business_name },
    app_metadata: { business_status: 'approved' },
  });
  if (error) {
    return {
      error: /already|registered|exists/i.test(error.message)
        ? 'כבר קיים חשבון עם המייל הזה'
        : 'יצירת העסק נכשלה, נסי שוב',
    };
  }

  await sendBusinessWelcome({
    businessEmail: email,
    businessName: business_name,
    loginUrl: `${APP_URL}/login`,
    createdByAdmin: true,
  });

  revalidatePath('/admin');
  return { success: `העסק "${business_name}" נוצר. מסרי לבעל העסק את המייל והסיסמה הזמנית` };
}
