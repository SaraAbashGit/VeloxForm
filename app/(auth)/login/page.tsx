import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthForm } from '@/components/auth/AuthForm';
import { signIn } from '../actions';

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>התחברות ל-FormAI</CardTitle>
          <CardDescription>היכנס לחשבון העסק שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm action={signIn} submitLabel="התחבר" pendingLabel="מתחבר...">
            {searchParams.next && <input type="hidden" name="next" value={searchParams.next} />}
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" required dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input id="password" name="password" type="password" required dir="ltr" />
            </div>
          </AuthForm>
          <div className="mt-4 text-center text-sm space-y-2">
            <Link href="/register" className="text-brand-500 hover:underline block">אין לך חשבון? הירשם</Link>
            <Link href="/reset-password" className="text-muted-foreground hover:underline block">שכחת סיסמה?</Link>
            <Link href="/client/login" className="text-brand-cyan-700 hover:underline block pt-2 border-t">
              לקוח/ה של עסק? כניסה ללקוחות
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
