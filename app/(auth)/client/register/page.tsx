import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthForm } from '@/components/auth/AuthForm';
import { safeNext } from '@/lib/auth/roles';
import { clientSignUp } from '../actions';

export default function ClientRegisterPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next, '/my');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>הרשמה ללקוחות</CardTitle>
          <CardDescription>חשבון אחד לכל הטפסים שתמלאו, וכל המסמכים החתומים במקום אחד</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm action={clientSignUp} submitLabel="הרשמה" pendingLabel="נרשם...">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-2">
              <Label htmlFor="full_name">שם מלא</Label>
              <Input id="full_name" name="full_name" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" required dir="ltr" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input id="password" name="password" type="password" required minLength={6} dir="ltr" autoComplete="new-password" />
            </div>
          </AuthForm>
          <p className="mt-4 text-center text-sm">
            <Link href={`/client/login?next=${encodeURIComponent(next)}`} className="text-brand-500 hover:underline">
              כבר יש לך חשבון? להתחברות
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
