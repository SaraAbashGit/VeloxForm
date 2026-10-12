import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClientShell } from '@/components/client/ClientShell';

// Customer area: same fixed side menu as on the public pages a signed-in customer visits
export default async function ClientAreaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/client/login?next=/my');

  return (
    <ClientShell user={user} active="my">
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </ClientShell>
  );
}
