import { redirect } from 'next/navigation';
import { Building2, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { businessStatus, isAdminUser, isClientUser, type BusinessStatus } from '@/lib/auth/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AuthForm } from '@/components/auth/AuthForm';
import { createBusiness, setBusinessStatus } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<BusinessStatus, { label: string; className: string }> = {
  pending: { label: 'ממתין לאישור', className: 'bg-amber-50 text-amber-700' },
  approved: { label: 'מאושר', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'נדחה', className: 'bg-red-50 text-red-700' },
};

async function getBusinesses() {
  const service = createServiceClient();
  // MVP scale: one page of users is enough
  const [{ data: usersPage }, { data: profiles }, { data: forms }] = await Promise.all([
    service.auth.admin.listUsers({ perPage: 1000 }),
    service.from('users').select('id, business_name'),
    service.from('forms').select('user_id'),
  ]);

  const nameById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.business_name as string]));
  const formCount: Record<string, number> = {};
  (forms ?? []).forEach((f) => (formCount[f.user_id] = (formCount[f.user_id] ?? 0) + 1));
  const order: Record<BusinessStatus, number> = { pending: 0, approved: 1, rejected: 2 };

  return (usersPage?.users ?? [])
    .filter((u) => !isClientUser(u))
    .map((u) => ({
      id: u.id,
      name: nameById[u.id] ?? u.user_metadata?.business_name ?? 'ללא שם',
      email: u.email ?? '',
      createdAt: u.created_at,
      emailConfirmed: !!u.email_confirmed_at,
      status: isAdminUser(u) ? ('approved' as const) : businessStatus(u),
      isAdmin: isAdminUser(u),
      forms: formCount[u.id] ?? 0,
    }))
    .sort((a, b) => order[a.status] - order[b.status] || b.createdAt.localeCompare(a.createdAt));
}

export default async function AdminPage() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!isAdminUser(user)) redirect('/dashboard');

  const businesses = await getBusinesses();
  const pending = businesses.filter((b) => b.status === 'pending').length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="ניהול פלטפורמה"
        subtitle={`${businesses.length} עסקים · ${pending} ממתינים לאישור`}
      />

      <Card>
        <CardHeader>
          <CardTitle>העסקים בפלטפורמה</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {businesses.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-sage-50">
                  <Building2 className="h-5 w-5 text-brand-teal" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-brand-teal">
                    {b.name}
                    {b.isAdmin && <span className="ms-2 text-xs text-muted-foreground">(את)</span>}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground" dir="ltr">{b.email}</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  נרשם {new Date(b.createdAt).toLocaleDateString('he-IL')} · {b.forms} טפסים
                  {!b.emailConfirmed && ' · המייל עוד לא אומת'}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[b.status].className}`}>
                  {STATUS_BADGE[b.status].label}
                </span>
                {!b.isAdmin && (
                  <span className="flex gap-2">
                    {b.status !== 'approved' && (
                      <form action={setBusinessStatus.bind(null, b.id, 'approved')}>
                        <Button size="sm" type="submit" className="gap-1">
                          <Check className="h-4 w-4" />
                          אישור
                        </Button>
                      </form>
                    )}
                    {b.status !== 'rejected' && (
                      <form action={setBusinessStatus.bind(null, b.id, 'rejected')}>
                        <Button size="sm" variant="outline" type="submit" className="gap-1">
                          <X className="h-4 w-4" />
                          {b.status === 'approved' ? 'חסימה' : 'דחייה'}
                        </Button>
                      </form>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>יצירת עסק חדש</CardTitle>
          <p className="text-sm text-muted-foreground">
            עסק שנפתח מכאן מאושר מיד. מסרי לבעל העסק את המייל והסיסמה הזמנית.
          </p>
        </CardHeader>
        <CardContent>
          <AuthForm action={createBusiness} submitLabel="יצירת העסק" pendingLabel="יוצר...">
            <div className="space-y-2">
              <Label htmlFor="business_name">שם העסק</Label>
              <Input id="business_name" name="business_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">מייל של בעל העסק</Label>
              <Input id="email" name="email" type="email" required dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה זמנית</Label>
              <Input id="password" name="password" type="text" required minLength={6} dir="ltr" autoComplete="off" />
            </div>
          </AuthForm>
        </CardContent>
      </Card>
    </div>
  );
}
