import { Building2, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getBusinessDetails, isValidApprovalToken } from '@/lib/business-approval';
import { decideFromEmail } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_TEXT = {
  pending: { label: 'ממתין לאישור', className: 'bg-amber-50 text-amber-700' },
  approved: { label: 'העסק אושר ✓', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'העסק נדחה', className: 'bg-red-50 text-red-700' },
};

export default async function ApproveBusinessPage({
  params,
  searchParams,
}: {
  params: { businessId: string };
  searchParams: { t?: string };
}) {
  const token = searchParams.t ?? '';
  const business = isValidApprovalToken(params.businessId, token) ? await getBusinessDetails(params.businessId) : null;

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>הקישור לא תקין</CardTitle>
            <CardDescription>אפשר לאשר עסקים גם ממסך ניהול הפלטפורמה, אחרי התחברות.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const status = STATUS_TEXT[business.status];
  const rows = [
    ['שם העסק', business.name],
    ['מייל', business.email],
    ['תאריך הרשמה', new Date(business.createdAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })],
    ['אימות מייל', business.emailConfirmed ? 'המייל אומת' : 'המייל עוד לא אומת'],
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-brand-sage-50">
            <Building2 className="h-7 w-7 text-brand-teal" />
          </span>
          <CardTitle>אישור עסק חדש</CardTitle>
          <CardDescription>בדקי את פרטי העסק לפני האישור</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="divide-y rounded-lg border">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium text-end break-all">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="text-center">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}>{status.label}</span>
          </p>

          <div className="flex gap-3">
            {business.status !== 'approved' && (
              <form action={decideFromEmail.bind(null, business.id, token, 'approved')} className="flex-1">
                <Button type="submit" className="w-full gap-1">
                  <Check className="h-4 w-4" />
                  אישור העסק
                </Button>
              </form>
            )}
            {business.status !== 'rejected' && (
              <form action={decideFromEmail.bind(null, business.id, token, 'rejected')} className="flex-1">
                <Button type="submit" variant="outline" className="w-full gap-1">
                  <X className="h-4 w-4" />
                  {business.status === 'approved' ? 'חסימת העסק' : 'דחייה'}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
