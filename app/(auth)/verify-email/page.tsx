import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>אמת את האימייל שלך</CardTitle>
          <CardDescription>שלחנו לך קישור לאימות. בדוק את תיבת הדואר שלך.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/login">חזרה להתחברות</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
