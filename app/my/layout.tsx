import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FolderOpen, LogOut, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { clientName } from '@/lib/auth/roles';
import { linkedBusinessIds } from '@/lib/auth/client-businesses';
import { clientSignOut } from '@/app/(auth)/client/actions';

// Customer area: same shell as the business dashboard (fixed sidebar), but only the customer's own things
export default async function ClientAreaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/client/login?next=/my');

  const ids = linkedBusinessIds(user);
  const { data: businesses } = ids.length
    ? await createServiceClient().from('users').select('id, business_name').in('id', ids)
    : { data: [] as { id: string; business_name: string }[] };

  const signOut = (
    <form action={clientSignOut}>
      <Button type="submit" variant="ghost" className="w-full justify-start gap-3 text-brand-sage hover:bg-white/10 hover:text-white">
        <LogOut className="h-4 w-4" />
        התנתקות
      </Button>
    </form>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      <div className="hidden md:block md:sticky md:top-0 md:h-screen md:shrink-0">
        <aside className="flex h-screen w-64 flex-col overflow-y-auto bg-brand-ink p-4">
          <Link href="/my" className="mb-8 px-1">
            <Logo tone="light" />
          </Link>
          <nav className="flex-1 space-y-1">
            <Link href="/my" className="flex items-center gap-3 rounded-lg bg-brand-teal px-3 py-2 text-sm font-medium text-brand-cyan">
              <FolderOpen className="h-4 w-4" />
              המסמכים שלי
            </Link>
            {(businesses ?? []).length > 0 && (
              <p className="px-3 pt-6 pb-1 text-xs font-semibold text-brand-sage/70">העסקים שלי</p>
            )}
            {(businesses ?? []).map((b) => (
              <Link
                key={b.id}
                href={`/b/${b.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-sage transition-colors hover:bg-white/10 hover:text-white"
              >
                <Store className="h-4 w-4" />
                <span className="truncate">{b.business_name}</span>
              </Link>
            ))}
          </nav>
          <p className="truncate px-3 pb-2 text-xs text-brand-sage/70">{clientName(user)}</p>
          {signOut}
        </aside>
      </div>

      <div className="min-w-0 flex-1">
        {/* Mobile: the sidebar is hidden, so keep logo and sign-out in a top bar */}
        <header className="flex items-center justify-between bg-brand-ink px-4 py-3 md:hidden">
          <Link href="/my">
            <Logo tone="light" size="sm" />
          </Link>
          <div className="w-32">{signOut}</div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
