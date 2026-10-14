import QRCode from 'qrcode';
import { Download, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { CopyLinkButton } from '@/components/dashboard/CopyLinkButton';
import { PrintButton } from '@/components/dashboard/PrintButton';
import { Logo } from '@/components/brand/Logo';
import { businessPageUrl, whatsappShareUrl } from '@/lib/share-links';

export default async function SharePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // middleware redirects

  const { data: profile } = await supabase.from('users').select('business_name').eq('id', user.id).single();
  const name = profile?.business_name || 'העסק שלי';
  const url = businessPageUrl(user.id);

  const [qrSvg, qrPng] = await Promise.all([
    QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#191918', light: '#ffffff' } }),
    QRCode.toDataURL(url, { width: 1024, margin: 2 }),
  ]);

  const message = `שלום! 👋\nמעכשיו אפשר למלא ולחתום על הטפסים של ${name} אונליין, מהטלפון, בלי להגיע פיזית.\nלהצטרפות כלקוחות: ${url}`;

  return (
    <div className="space-y-8">
      <div className="print:hidden">
        <PageHeader title="שיתוף העסק" subtitle="הזמינו לקוחות חדשים: שלט עם QR, וואטסאפ או קישור" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* The printable sign: the only thing left on the page when printing */}
        <Card className="overflow-hidden print:border-0 print:shadow-none">
          <div className="bg-brand-ink px-6 py-8 text-center text-white">
            <p className="text-sm text-brand-sage">מילוי וחתימה על טפסים אונליין</p>
            <h2 className="mt-1 text-3xl font-bold font-display">{name}</h2>
          </div>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div
              className="w-56 rounded-xl border-4 border-brand-cyan bg-white p-2 [&_svg]:h-auto [&_svg]:w-full print:w-80"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="text-xl font-bold font-display text-brand-teal">סרקו והצטרפו כלקוחות</p>
            <p className="max-w-xs text-center text-sm text-muted-foreground">
              כל הטפסים במקום אחד: ממלאים, חותמים ושולחים מהטלפון
            </p>
            <p className="text-xs text-muted-foreground break-all" dir="ltr">{url}</p>
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              נוצר באמצעות <Logo size="sm" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">שלט לעסק</CardTitle>
              <p className="text-sm text-muted-foreground">
                הדפיסו ותלו ליד הקופה או בחדר ההמתנה. לקוחות סורקים במצלמה ונרשמים בעצמם.
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <PrintButton label="הדפסת השלט" />
              <Button asChild variant="outline">
                <a href={qrPng} download={`qr-${name}.png`}>
                  <Download className="h-4 w-4" />
                  הורדת קוד QR
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">שליחה בוואטסאפ</CardTitle>
              <p className="text-sm text-muted-foreground">ההודעה נפתחת בוואטסאפ שלכם, ובוחרים למי לשלוח (גם לקבוצות וסטטוס).</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-line rounded-lg bg-brand-sage-50 p-4 text-sm">{message}</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
                  <a href={whatsappShareUrl(message)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    שיתוף בוואטסאפ
                  </a>
                </Button>
                <CopyLinkButton path={`/b/${user.id}`} label="העתקת הקישור" variant="outline" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
