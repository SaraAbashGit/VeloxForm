import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthForm } from '@/components/auth/AuthForm';
import { updatePassword } from '../actions';

// Reached from the reset-password email (via /auth/callback, which already logged the user in)
export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>בחירת סיסמה חדשה</CardTitle>
          <CardDescription>הזיני סיסמה חדשה לחשבון</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm action={updatePassword} submitLabel="שמור סיסמה" pendingLabel="שומר...">
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה חדשה</Label>
              <Input id="password" name="password" type="password" required minLength={6} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">אימות סיסמה</Label>
              <Input id="confirm" name="confirm" type="password" required minLength={6} dir="ltr" />
            </div>
          </AuthForm>
        </CardContent>
      </Card>
    </div>
  );
}
