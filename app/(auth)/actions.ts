'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Shape returned to useFormState in the auth pages
export type AuthState = { error?: string; success?: string } | undefined;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Supabase answers in English; show the common cases in Hebrew
function translateError(message: string) {
  if (/invalid login credentials/i.test(message)) return 'אימייל או סיסמה שגויים';
  if (/email not confirmed/i.test(message)) return 'צריך לאשר את המייל לפני ההתחברות. בדקי את תיבת הדואר';
  if (/already registered/i.test(message)) return 'כבר קיים חשבון עם המייל הזה';
  if (/password should be at least/i.test(message)) return 'הסיסמה צריכה להכיל לפחות 6 תווים';
  if (/rate limit|too many/i.test(message)) return 'יותר מדי ניסיונות. נסי שוב בעוד כמה דקות';
  return 'משהו השתבש, נסי שוב';
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const businessName = formData.get('business_name') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { business_name: businessName },
      emailRedirectTo: `${APP_URL}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return { error: translateError(error.message) };
  redirect('/verify-email');
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translateError(error.message) };
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
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
