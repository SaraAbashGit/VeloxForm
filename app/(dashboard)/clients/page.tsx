import Link from 'next/link';
import { ChevronLeft, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { CopyLinkButton } from '@/components/dashboard/CopyLinkButton';
import { getBusinessClients } from '@/lib/business-clients';

export default async function ClientsPage() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return null; // middleware redirects
  const clients = await getBusinessClients(user.id);
  const needFollowUp = clients.filter((c) => c.missingForms.length > 0).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="הלקוחות שלי"
        subtitle={
          clients.length
            ? `${clients.length} לקוחות רשומים · ${needFollowUp} עם טפסים חסרים`
            : 'לקוחות שנרשמים דרך הקישור שלך יופיעו כאן'
        }
      />

      {clients.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {clients.map((client) => (
                <li key={client.id}>
                  <Link
                    href={`/clients/${client.id}`}
                    className="flex flex-wrap items-center gap-4 px-6 py-4 transition-colors hover:bg-brand-sage-50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-cyan text-lg font-bold font-display text-brand-ink">
                      {client.name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-brand-teal">{client.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">{client.email}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {client.lastActivity
                        ? `פעיל/ה לאחרונה ${new Date(client.lastActivity).toLocaleDateString('he-IL')}`
                        : 'עוד לא מילא/ה טופס'}
                    </span>
                    <span className="rounded-full bg-brand-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-brand-cyan-700">
                      {client.submissions.length} הגשות
                    </span>
                    {client.missingForms.length > 0 ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        חסרים {client.missingForms.length} טפסים
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        הכל מולא ✓
                      </span>
                    )}
                    <ChevronLeft className="h-5 w-5 text-brand-sage" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-sage-50">
              <Users className="h-8 w-8 text-brand-teal" />
            </span>
            <h2 className="text-xl font-bold font-display">עדיין אין לקוחות רשומים</h2>
            <p className="mt-1 text-muted-foreground">שלחו ללקוחות את הקישור לעמוד העסק. מי שיירשם דרכו יופיע כאן</p>
            <CopyLinkButton path={`/b/${user.id}`} label="העתק קישור לעמוד העסק" className="mt-6" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
