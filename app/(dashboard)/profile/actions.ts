'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const businessNameSchema = z
  .string()
  .trim()
  .min(2, 'שם העסק חייב להכיל לפחות 2 תווים')
  .max(100, 'שם העסק ארוך מדי');

export async function updateBusinessName(name: string) {
  const parsed = businessNameSchema.safeParse(name);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'יש להתחבר מחדש' };

  const { error } = await supabase
    .from('users')
    .update({ business_name: parsed.data })
    .eq('id', user.id);

  if (error) return { success: false, error: 'שגיאה בשמירת הפרטים' };

  revalidatePath('/profile');
  revalidatePath('/dashboard');
  return { success: true };
}
