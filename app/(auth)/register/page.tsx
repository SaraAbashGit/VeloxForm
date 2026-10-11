import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthForm } from '@/components/auth/AuthForm';
import { signUp } from '../actions';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>הרשמה ל-FormAI</CardTitle>
          <CardDescription>צור חשבון עסק חדש</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm action={signUp} submitLabel="הירשם" pendingLabel="נרשם...">
            <div className="space-y-2">
              <Label htmlFor="business_name">שם העסק</Label>
              <Input id="business_name" name="business_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" required dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input id="password" name="password" type="password" required minLength={6} dir="ltr" />
            </div>
          </AuthForm>
          <p className="mt-4 text-center text-sm">
            <Link href="/login" className="text-brand-500 hover:underline">כבר יש לך חשבון? התחבר</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
