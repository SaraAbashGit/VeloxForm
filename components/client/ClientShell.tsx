import Link from 'next/link';
import { FolderOpen, LogOut, Store } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/admin';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { clientName } from '@/lib/auth/roles';
import { linkedBusinessIds } from '@/lib/auth/client-businesses';
import { clientSignOut } from '@/app/(auth)/client/actions';

// Fixed side menu for a signed-in customer, used by /my and by public form/business pages.
// Keep it on every customer page (the user asked for this explicitly).
export async function ClientShell({
  user,
  active,
  children,
}: {
  user: User;
  /** 'my' for the documents page, or the id of the business being viewed */
  active: string;
  children: React.ReactNode;
}) {
  // The business being viewed is linked during this same request, so the user object may not list it yet
  const ids = Array.from(new Set([...linkedBusinessIds(user), ...(active !== 'my' ? [active] : [])]));
  const { data: businesses } = ids.length
    ? await createServiceClient().from('users').select('id, business_name').in('id', ids)
    : { data: [] as { id: string; business_name: string }[] };

  const item = (isActive: boolean) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
      isActive ? 'bg-brand-teal font-medium text-brand-cyan' : 'text-brand-sage hover:bg-white/10 hover:text-white'
    );

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
      {/* The wrapper itself is sticky: a sticky child only sticks within its parent's height */}
      <div className="hidden md:block md:sticky md:top-0 md:h-screen md:shrink-0">
        <aside className="flex h-screen w-64 flex-col overflow-y-auto bg-brand-ink p-4">
          <Link href="/my" className="mb-8 px-1">
            <Logo tone="light" />
          </Link>
          <nav className="flex-1 space-y-1">
            <Link href="/my" className={item(active === 'my')}>
              <FolderOpen className="h-4 w-4" />
              המסמכים שלי
            </Link>
            {(businesses ?? []).length > 0 && (
              <p className="px-3 pb-1 pt-6 text-xs font-semibold text-brand-sage/70">העסקים שלי</p>
            )}
            {(businesses ?? []).map((b) => (
              <Link key={b.id} href={`/b/${b.id}`} className={item(active === b.id)}>
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
        {/* Mobile: sidebar hidden, so keep logo, documents link and sign-out in a top bar */}
        <header className="flex items-center justify-between gap-2 bg-brand-ink px-4 py-3 md:hidden">
          <Link href="/my">
            <Logo tone="light" size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/my" className="flex items-center gap-1 px-2 text-sm text-brand-cyan">
              <FolderOpen className="h-4 w-4" />
              המסמכים שלי
            </Link>
            <form action={clientSignOut}>
              <Button type="submit" variant="ghost" size="icon" aria-label="התנתקות" className="text-brand-sage hover:bg-white/10 hover:text-white">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
