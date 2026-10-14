import Link from 'next/link';
import { Sidebar, MobileNav } from '@/components/dashboard/Sidebar';
import { Logo } from '@/components/brand/Logo';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth/roles';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  const isAdmin = isAdminUser(user);

  return (
    <div className="flex min-h-screen">
      {/* The wrapper itself must be sticky: a sticky child only sticks within its parent's height */}
      <div className="hidden md:block md:sticky md:top-0 md:h-screen md:shrink-0">
        <Sidebar isAdmin={isAdmin} />
      </div>
      <div className="flex-1 min-w-0">
        {/* Mobile top bar with the logo (the sidebar is hidden on small screens) */}
        <header className="md:hidden bg-brand-600 px-4 py-3">
          <Link href="/dashboard">
            <Logo tone="light" size="sm" />
          </Link>
        </header>
        <main className="p-4 md:p-8 pb-24 md:pb-8">{children}</main>
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
