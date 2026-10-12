import Link from 'next/link';
import { Check, ChevronLeft, Download, FileText, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GeometricPattern } from '@/components/brand/GeometricPattern';
import { clientName } from '@/lib/auth/roles';
import { linkedBusinessIds } from '@/lib/auth/client-businesses';
import type { Form } from '@/types/form';

export default async function MyDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // layout already redirects

  // Service client + explicit client_id / business filters: a customer cannot read other businesses' rows directly
  const service = createServiceClient();
  const { data: submissions } = await service
    .from('submissions')
    .select('id, form_id, submitted_at, pdf_url, snapshot_json, forms(user_id)')
    .eq('client_id', user.id)
    .order('submitted_at', { ascending: false });

  const history = (submissions ?? []).map((s) => ({
    ...s,
    title: (s.snapshot_json as Form).title,
    businessId: (s.forms as unknown as { user_id: string } | null)?.user_id ?? null,
  }));

  // Businesses = the ones the customer joined through a link + any they already submitted to
  const businessIds = Array.from(
    new Set([...linkedBusinessIds(user), ...history.map((h) => h.businessId).filter((id): id is string => !!id)])
  );

  const [{ data: businesses }, { data: activeForms }] = businessIds.length
    ? await Promise.all([
        service.from('users').select('id, business_name').in('id', businessIds),
        service
          .from('forms')
          .select('id, title, slug, user_id')
          .in('user_id', businessIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const businessName = Object.fromEntries((businesses ?? []).map((b) => [b.id, b.business_name as string]));
  // Latest submission per form, to mark forms the customer already filled
  const lastSubmission = new Map<string, (typeof history)[number]>();
  for (const h of history) if (!lastSubmission.has(h.form_id)) lastSubmission.set(h.form_id, h);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl bg-brand-teal p-6 text-white">
        <GeometricPattern className="absolute inset-y-0 left-0 hidden h-full w-32 sm:block" />
        <div className="relative">
          <h1 className="text-3xl font-bold font-display">המסמכים שלי</h1>
          <p className="mt-1 text-white/80">שלום {clientName(user)}, כאן הטפסים של העסקים שלך וכל מה שחתמת</p>
        </div>
      </div>

      {businessIds.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-sage-50">
              <Store className="h-8 w-8 text-brand-teal" />
            </span>
            <h2 className="text-xl font-bold font-display">עדיין לא חוברת לאף עסק</h2>
            <p className="mt-1 text-muted-foreground">פתחו את הקישור שקיבלתם מהעסק, והטפסים שלו יופיעו כאן</p>
          </CardContent>
        </Card>
      )}

      {/* One card per business: every active form, with "to fill" or "sent" */}
      {businessIds.map((businessId) => {
        const forms = (activeForms ?? []).filter((f) => f.user_id === businessId);
        return (
          <Card key={businessId} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 border-b bg-white">
              <CardTitle className="flex items-center gap-3 text-lg">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan text-brand-ink font-display">
                  {(businessName[businessId] ?? 'ע').charAt(0)}
                </span>
                {businessName[businessId] ?? 'עסק'}
              </CardTitle>
              <Link href={`/b/${businessId}`} className="text-sm text-brand-cyan-700 hover:underline">
                לעמוד העסק
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {forms.length > 0 ? (
                <ul className="divide-y">
                  {forms.map((form) => {
                    const done = lastSubmission.get(form.id);
                    return (
                      <li key={form.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                        <FileText className="h-5 w-5 shrink-0 text-brand-sage" />
                        <span className="min-w-0 flex-1 font-medium text-brand-teal">{form.title}</span>
                        {done ? (
                          <>
                            <span className="flex items-center gap-1 rounded-full bg-brand-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-brand-cyan-700">
                              <Check className="h-3 w-3" />
                              נשלח {new Date(done.submitted_at).toLocaleDateString('he-IL')}
                            </span>
                            <Link href={`/forms/${form.slug}`} className="text-sm text-muted-foreground hover:underline">
                              מילוי שוב
                            </Link>
                          </>
                        ) : (
                          <Button asChild size="sm">
                            <Link href={`/forms/${form.slug}`}>
                              למילוי
                              <ChevronLeft className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-6 py-6 text-sm text-muted-foreground">אין כרגע טפסים פתוחים בעסק הזה</p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold font-display text-brand-teal">מסמכים שחתמתי</h2>
          <ul className="space-y-3">
            {history.map((row) => (
              <li key={row.id}>
                <Card>
                  <CardContent className="flex flex-wrap items-center gap-4 p-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-cyan-50 text-brand-teal">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-brand-teal">{row.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {(row.businessId && businessName[row.businessId]) || 'עסק'} ·{' '}
                        {new Date(row.submitted_at).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    {row.pdf_url && (
                      <Button asChild size="sm" variant="outline">
                        <a href={`/my/${row.id}/pdf`} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                          PDF
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
