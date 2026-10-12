'use server';

import { isRateLimited, LIMITS, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { safeNext } from '@/lib/auth/roles';
import { businessIdFromPath, linkClientToBusiness } from '@/lib/auth/client-businesses';
import type { AuthState } from '../actions';

const registerSchema = z.object({
  full_name: z.string().trim().min(2, 'נא להזין שם מלא').max(100),
  email: z.string().trim().email('כתובת מייל לא תקינה'),
  password: z.string().min(6, 'הסיסמה צריכה להכיל לפחות 6 תווים').max(72),
});

// Customers skip email verification: Supabase's free mailer allows only a few emails per hour,
// which would block customers mid-form. Business owners still verify their email.
export async function clientSignUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { limit, windowMs } = LIMITS.signUp;
  if (isRateLimited('clientSignUp', limit, windowMs)) return { error: RATE_LIMIT_MESSAGE };

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { full_name, email, password } = parsed.data;

  const { error: createError } = await createServiceClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'client', full_name },
  });
  if (createError) {
    return {
      error: /already|registered|exists/i.test(createError.message)
        ? 'כבר קיים חשבון עם המייל הזה. אפשר להתחבר'
        : 'ההרשמה נכשלה, נסי שוב',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'החשבון נוצר, אבל ההתחברות נכשלה. נסי להתחבר' };

  // Signing up from a business link connects the customer to that business
  const next = safeNext(formData.get('next'), '/my');
  await linkClientToBusiness(data.user, await businessIdFromPath(next));
  redirect(next);
}

export async function clientSignIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { limit, windowMs } = LIMITS.signIn;
  if (isRateLimited('clientSignIn', limit, windowMs)) return { error: RATE_LIMIT_MESSAGE };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
  if (error) return { error: 'אימייל או סיסמה שגויים' };

  const next = safeNext(formData.get('next'), '/my');
  await linkClientToBusiness(data.user, await businessIdFromPath(next));
  redirect(next);
}

export async function clientSignOut(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(safeNext(formData.get('next'), '/client/login'));
}
