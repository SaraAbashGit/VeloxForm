import { Check, Download, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GeometricPattern } from '@/components/brand/GeometricPattern';
import { clientName } from '@/lib/auth/roles';
import type { Form } from '@/types/form';

export default async function MyDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // layout already redirects

  // Service client + explicit client_id filter: the customer may not be allowed to read the (possibly inactive) form rows
  const service = createServiceClient();
  const { data: submissions } = await service
    .from('submissions')
    .select('id, submitted_at, pdf_url, snapshot_json, forms(user_id)')
    .eq('client_id', user.id)
    .order('submitted_at', { ascending: false });

  const rows = (submissions ?? []).map((s) => {
    const owner = (s.forms as unknown as { user_id: string } | null)?.user_id ?? null;
    return { ...s, title: (s.snapshot_json as Form).title, businessId: owner };
  });

  const businessIds = Array.from(new Set(rows.map((r) => r.businessId).filter(Boolean))) as string[];
  const { data: businesses } = businessIds.length
    ? await service.from('users').select('id, business_name').in('id', businessIds)
    : { data: [] as { id: string; business_name: string }[] };
  const businessName = Object.fromEntries((businesses ?? []).map((b) => [b.id, b.business_name]));

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-brand-teal p-6 text-white">
        <GeometricPattern className="absolute inset-y-0 left-0 hidden h-full w-32 sm:block" />
        <div className="relative">
          <h1 className="text-3xl font-bold font-display">המסמכים שלי</h1>
          <p className="mt-1 text-white/80">שלום {clientName(user)}, כאן כל הטפסים שמילאת וחתמת</p>
        </div>
      </div>

      {rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-cyan-50 text-brand-teal">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-teal">{row.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.businessId ? businessName[row.businessId] ?? 'עסק' : 'עסק'} ·{' '}
                      {new Date(row.submitted_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-brand-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-brand-cyan-700">
                    <Check className="h-3 w-3" />
                    נשלח
                  </span>
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
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-sage-50">
              <FileText className="h-8 w-8 text-brand-teal" />
            </span>
            <h2 className="text-xl font-bold font-display">עדיין אין מסמכים</h2>
            <p className="mt-1 text-muted-foreground">
              טפסים שתמלאו כשאתם מחוברים יופיעו כאן. פתחו את הקישור שקיבלתם מהעסק כדי למלא טופס.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
