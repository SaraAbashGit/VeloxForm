import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { clientName } from '@/lib/auth/roles';
import { clientSignOut } from '@/app/(auth)/client/actions';

// Customer area: deliberately separate from the business dashboard (no sidebar, no business data)
export default async function ClientAreaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/client/login?next=/my');

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-brand-ink text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/my">
            <Logo tone="light" size="sm" />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-brand-sage sm:inline">{clientName(user)}</span>
            <form action={clientSignOut}>
              <Button type="submit" variant="ghost" size="sm" className="text-brand-sage hover:bg-white/10 hover:text-white">
                <LogOut className="h-4 w-4" />
                התנתקות
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
