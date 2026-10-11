import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthForm } from '@/components/auth/AuthForm';
import Link from 'next/link';
import { resetPassword } from '../actions';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>איפוס סיסמה</CardTitle>
          <CardDescription>הזן את האימייל שלך ונשלח קישור לאיפוס</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm action={resetPassword} submitLabel="שלח קישור" pendingLabel="שולח...">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" required dir="ltr" />
            </div>
          </AuthForm>
          <p className="mt-4 text-center text-sm">
            <Link href="/login" className="text-brand-500 hover:underline">חזרה להתחברות</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
