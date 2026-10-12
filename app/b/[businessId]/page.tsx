import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FileText } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { ClientBar } from '@/components/client/ClientBar';
import { GeometricPattern } from '@/components/brand/GeometricPattern';
import { Logo } from '@/components/brand/Logo';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Public page of one business: all its active forms, no login needed.
// Uses the service client because users' rows are owner-only under RLS, so select ONLY public columns here.
export default async function BusinessPage({ params }: { params: { businessId: string } }) {
  if (!UUID.test(params.businessId)) notFound();
  const supabase = createServiceClient();

  const { data: business } = await supabase
    .from('users')
    .select('business_name')
    .eq('id', params.businessId)
    .single();

  if (!business) notFound();

  const { data: forms } = await supabase
    .from('forms')
    .select('title, description, slug')
    .eq('user_id', params.businessId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const name = business.business_name || 'העסק';
  const { data: { user } } = await (await createClient()).auth.getUser();

  return (
    <div className="min-h-screen bg-surface">
      <ClientBar user={user} next={`/b/${params.businessId}`} />
      <header className="relative overflow-hidden bg-brand-ink text-white">
        <GeometricPattern className="absolute inset-y-0 left-0 h-full w-32 sm:w-48" />
        <div className="relative mx-auto flex max-w-2xl items-center gap-4 px-4 py-10 sm:py-14">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-cyan text-2xl font-bold font-display text-brand-ink">
            {name.charAt(0)}
          </span>
          <div>
            <h1 className="text-3xl font-bold font-display">{name}</h1>
            <p className="mt-1 text-brand-sage">בחרו טופס, מלאו וחתמו אונליין</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {forms && forms.length > 0 ? (
          <ul className="space-y-3">
            {forms.map((form) => (
              <li key={form.slug}>
                <Link
                  href={`/forms/${form.slug}`}
                  className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-colors hover:border-brand-cyan hover:bg-brand-cyan-50"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-brand-teal">{form.title}</span>
                    {form.description && (
                      <span className="block truncate text-sm text-muted-foreground">{form.description}</span>
                    )}
                  </span>
                  <ChevronLeft className="h-5 w-5 shrink-0 text-brand-sage" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border bg-white py-16 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 h-10 w-10 text-brand-sage" />
            אין כרגע טפסים זמינים
          </div>
        )}
      </main>

      <footer className="flex items-center justify-center gap-2 pb-8 text-xs text-muted-foreground">
        נוצר באמצעות
        <Logo size="sm" />
      </footer>
    </div>
  );
}
