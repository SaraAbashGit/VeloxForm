import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthForm } from '@/components/auth/AuthForm';
import { safeNext } from '@/lib/auth/roles';
import { clientSignIn } from '../actions';

// Login for customers of a business (not business owners); `next` returns them to the form they came from
export default function ClientLoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(searchParams.next, '/my');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>כניסה ללקוחות</CardTitle>
          <CardDescription>התחברו כדי למלא טפסים ולראות את המסמכים שחתמתם</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm action={clientSignIn} submitLabel="התחברות" pendingLabel="מתחבר...">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" required dir="ltr" autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input id="password" name="password" type="password" required dir="ltr" autoComplete="current-password" />
            </div>
          </AuthForm>
          <div className="mt-4 text-center text-sm space-y-2">
            <Link href={`/client/register?next=${encodeURIComponent(next)}`} className="text-brand-500 hover:underline block">
              אין לך חשבון? להרשמה
            </Link>
            <Link href="/reset-password" className="text-muted-foreground hover:underline block">שכחת סיסמה?</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
