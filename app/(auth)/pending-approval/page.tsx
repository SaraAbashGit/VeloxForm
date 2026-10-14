import { redirect } from 'next/navigation';
import { Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { businessStatus, isAdminUser, isClientUser } from '@/lib/auth/roles';
import { signOut } from '../actions';

export const dynamic = 'force-dynamic';

export default async function PendingApprovalPage() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect('/login');
  if (isClientUser(user)) redirect('/my');
  const status = businessStatus(user);
  if (status === 'approved' || isAdminUser(user)) redirect('/dashboard');

  const rejected = status === 'rejected';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <span className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-brand-sage-50">
            {rejected ? <XCircle className="h-7 w-7 text-red-600" /> : <Clock className="h-7 w-7 text-brand-teal" />}
          </span>
          <CardTitle>{rejected ? 'בקשת ההצטרפות לא אושרה' : 'החשבון ממתין לאישור'}</CardTitle>
          <CardDescription>
            {rejected
              ? 'מנהלת הפלטפורמה לא אישרה את פתיחת החשבון העסקי. לפרטים נוספים אפשר לפנות אליה ישירות.'
              : 'קיבלנו את ההרשמה שלך. מנהלת הפלטפורמה תבדוק את הבקשה, ומיד אחרי האישור אפשר יהיה להתחיל ליצור טפסים.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!rejected && (
            <Button asChild className="w-full">
              {/* A plain link: the middleware re-checks the status and lets an approved account in */}
              <a href="/dashboard">בדיקה אם החשבון אושר</a>
            </Button>
          )}
          <form action={signOut}>
            <Button variant="outline" type="submit" className="w-full">
              התנתקות
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
