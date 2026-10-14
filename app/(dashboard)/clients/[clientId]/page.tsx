import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertCircle, Check, FileText, Mail, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { CopyLinkButton } from '@/components/dashboard/CopyLinkButton';
import { getBusinessClients } from '@/lib/business-clients';
import { formUrl, mailtoUrl, whatsappShareUrl } from '@/lib/share-links';

export default async function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // Only customers connected to this business are found, so another business's customer gives 404
  const client = (await getBusinessClients(user.id)).find((c) => c.id === params.clientId);
  if (!client) notFound();

  const { data: profile } = await supabase.from('users').select('business_name').eq('id', user.id).single();
  const businessName = profile?.business_name || 'העסק';
  // One message listing every missing form, sent from the owner's own WhatsApp or email app
  const reminder = [
    `שלום ${client.name},`,
    `תזכורת מ${businessName}: נשמח אם תמלאו את ${client.missingForms.length > 1 ? 'הטפסים הבאים' : 'הטופס הבא'}:`,
    ...client.missingForms.map((f) => `• ${f.title}: ${formUrl(f.slug)}`),
    'תודה!',
  ].join('\n');

  return (
    <div className="space-y-8">
      <PageHeader
        title={client.name}
        subtitle={client.email}
        action={
          <Button asChild variant="outline" className="border-brand-sage text-white hover:bg-white/10">
            <Link href="/clients">חזרה ללקוחות</Link>
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Check className="h-5 w-5 text-brand-cyan-700" />
              טפסים שמולאו ({client.submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.submissions.length > 0 ? (
              <ul className="space-y-1">
                {client.submissions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/forms/${s.formId}/submissions/${s.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg p-2 text-sm hover:bg-muted"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-brand-sage" />
                        {s.formTitle}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(s.submittedAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">עוד לא מולא אף טופס</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              טפסים שחסרים ({client.missingForms.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {client.missingForms.length > 0 ? (
              <ul className="space-y-2">
                {client.missingForms.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm">
                    <span>{f.title}</span>
                    {/* Copy the form link to send the customer a reminder */}
                    <CopyLinkButton path={`/forms/${f.slug}`} label="קישור לתזכורת" size="sm" variant="outline" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-emerald-700">כל הטפסים הפעילים מולאו ✓</p>
            )}
            {client.missingForms.length > 0 && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <p className="text-sm font-medium">שליחת תזכורת על כל הטפסים החסרים:</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
                    <a href={whatsappShareUrl(reminder)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      תזכורת בוואטסאפ
                    </a>
                  </Button>
                  {client.email && (
                    <Button asChild size="sm" variant="outline">
                      <a href={mailtoUrl(client.email, `תזכורת: טפסים למילוי מ${businessName}`, reminder)}>
                        <Mail className="h-4 w-4" />
                        תזכורת במייל
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">לקוח/ה מאז {new Date(client.joinedAt).toLocaleDateString('he-IL')}</p>
    </div>
  );
}
