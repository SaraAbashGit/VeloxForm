'use server';

import { isRateLimited, LIMITS, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { APP_URL } from '@/lib/app-url';
import { ADMIN_EMAIL, safeNext } from '@/lib/auth/roles';
import { sendNewBusinessNotification } from '@/lib/email';
import { approvalUrl } from '@/lib/business-approval';

// Shape returned to useFormState in the auth pages
export type AuthState = { error?: string; success?: string } | undefined;

// Supabase answers in English; show the common cases in Hebrew
function translateError(message: string) {
  if (/invalid login credentials/i.test(message)) return 'אימייל או סיסמה שגויים';
  if (/email not confirmed/i.test(message)) return 'צריך לאשר את המייל לפני ההתחברות. בדקי את תיבת הדואר';
  if (/already registered/i.test(message)) return 'כבר קיים חשבון עם המייל הזה';
  if (/password should be at least/i.test(message)) return 'הסיסמה צריכה להכיל לפחות 6 תווים';
  if (/rate limit|too many/i.test(message)) return 'יותר מדי ניסיונות. נסי שוב בעוד כמה דקות';
  console.error('Auth error:', message); // unexpected: keep the original text for debugging
  return 'משהו השתבש, נסי שוב';
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { limit, windowMs } = LIMITS.signUp;
  if (isRateLimited('signUp', limit, windowMs)) return { error: RATE_LIMIT_MESSAGE };

  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const businessName = formData.get('business_name') as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { business_name: businessName },
      emailRedirectTo: `${APP_URL}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return { error: translateError(error.message) };

  // An already-registered email comes back as a placeholder user with no identities: leave that account alone
  if (data.user && data.user.identities?.length) {
    // Self-registered businesses wait for the platform admin's approval before they can work
    const { error: statusError } = await createServiceClient().auth.admin.updateUserById(data.user.id, {
      app_metadata: { business_status: 'pending' },
    });
    if (statusError) {
      await createServiceClient().auth.admin.deleteUser(data.user.id);
      return { error: 'ההרשמה נכשלה, נסי שוב' };
    }

    await sendNewBusinessNotification({
      adminEmail: ADMIN_EMAIL,
      businessName: businessName || email,
      businessEmail: email,
      approvalUrl: approvalUrl(data.user.id),
    });
  }

  redirect('/verify-email');
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { limit, windowMs } = LIMITS.signIn;
  if (isRateLimited('signIn', limit, windowMs)) return { error: RATE_LIMIT_MESSAGE };

  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translateError(error.message) };
  redirect(safeNext(formData.get('next'), '/dashboard'));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { limit, windowMs } = LIMITS.signUp;
  if (isRateLimited('resetPassword', limit, windowMs)) return { error: RATE_LIMIT_MESSAGE };

  const supabase = await createClient();
  const email = formData.get('email') as string;

  // The email link goes through /auth/callback, which logs the user in and opens the new-password page
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/auth/callback?next=/update-password`,
  });

  if (error) return { error: translateError(error.message) };
  return { success: 'אם המייל רשום במערכת, נשלח אליו קישור לאיפוס הסיסמה' };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const password = formData.get('password') as string;
  if (password !== formData.get('confirm')) return { error: 'הסיסמאות לא תואמות' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: translateError(error.message) };
  redirect('/dashboard');
}
