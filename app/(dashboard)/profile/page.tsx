import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-bold font-display">פרופיל</h1>
      <Card>
        <CardHeader>
          <CardTitle>פרטי העסק</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            businessName={profile?.business_name ?? ''}
            email={profile?.email ?? user?.email ?? ''}
          />
        </CardContent>
      </Card>
    </div>
  );
}
