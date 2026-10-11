import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single();

  const businessName = profile?.business_name ?? '';
  const email = profile?.email ?? user?.email ?? '';

  return (
    <div className="space-y-8">
      <PageHeader title="פרופיל" subtitle="פרטי העסק שמופיעים בטפסים וב-PDF" />

      <Card className="max-w-2xl overflow-hidden">
        <div className="flex items-center gap-4 bg-brand-teal p-6 text-white">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-cyan text-2xl font-bold font-display text-brand-ink">
            {(businessName || email).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-xl font-bold font-display truncate">{businessName || 'העסק שלי'}</p>
            <p className="text-white/80 text-sm truncate" dir="ltr">{email}</p>
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-lg">פרטי העסק</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm businessName={businessName} email={email} />
        </CardContent>
      </Card>
    </div>
  );
}
