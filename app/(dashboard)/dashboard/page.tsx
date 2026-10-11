import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { CopyLinkButton } from '@/components/dashboard/CopyLinkButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('business_name')
    .eq('id', user?.id)
    .single();

  const { data: forms } = await supabase
    .from('forms')
    .select('id, title, slug, created_at')
    // RLS also lets anyone read active forms (for the public page), so filter by owner explicitly
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  const formIds = forms?.map((f) => f.id) ?? [];
  let submissionCount = 0;
  let recentSubmissions: { id: string; submitted_at: string; form_id: string; forms: { title: string } | null }[] = [];

  if (formIds.length > 0) {
    const { count } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .in('form_id', formIds);
    submissionCount = count ?? 0;

    const { data } = await supabase
      .from('submissions')
      .select('id, submitted_at, form_id, forms(title)')
      .in('form_id', formIds)
      .order('submitted_at', { ascending: false })
      .limit(5);
    // forms(title) is many-to-one, so Supabase returns an object at runtime even though the generated type says array
    recentSubmissions = (data ?? []) as unknown as typeof recentSubmissions;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="לוח בקרה"
        subtitle={`שלום, ${profile?.business_name ?? user?.email}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/forms/new">+ טופס חדש עם AI</Link>
            </Button>
            <Button asChild variant="outline" className="border-brand-sage text-white hover:bg-white/10">
              <Link href={`/b/${user?.id}`} target="_blank">
                <ExternalLink className="h-4 w-4" />
                העמוד העסקי שלי
              </Link>
            </Button>
            <CopyLinkButton
              path={`/b/${user?.id}`}
              label="העתק קישור"
              variant="ghost"
              className="text-brand-sage hover:bg-white/10 hover:text-white"
            />
          </div>
        }
      />

      <StatsCards formCount={forms?.length ?? 0} submissionCount={submissionCount} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-brand-500 p-1.5 text-white">
                  <FileText className="h-4 w-4" />
                </span>
                הטפסים שלי
              </span>
              <Link href="/forms" className="text-sm font-medium text-brand-cyan-700 hover:underline">
                לכל הטפסים
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forms && forms.length > 0 ? (
              <ul className="space-y-2">
                {forms.map((form) => (
                  <li key={form.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                    <Link href={`/forms/${form.id}/edit`} className="font-medium hover:text-brand-500">
                      {form.title}
                    </Link>
                    <Link href={`/forms/${form.id}/submissions`} className="text-sm text-muted-foreground hover:text-brand-500">
                      הגשות
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>אין טפסים עדיין</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/forms/new">צור טופס ראשון</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <RecentActivity submissions={recentSubmissions} />
      </div>
    </div>
  );
}
