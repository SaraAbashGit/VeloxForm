import Link from 'next/link';
import { ChevronLeft, Inbox } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/PageHeader';

// All submissions grouped by form: one row per form, click through to that form's submissions
export default async function SubmissionsOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: forms } = await supabase
    .from('forms')
    .select('id, title, is_active, submissions(submitted_at)')
    // RLS also lets anyone read active forms, so filter by owner explicitly
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const rows = (forms ?? [])
    .map((form) => {
      const dates = (form.submissions as { submitted_at: string }[]).map((s) => new Date(s.submitted_at));
      const last = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
      return {
        ...form,
        total: dates.length,
        today: dates.filter((d) => d >= startOfToday).length,
        last,
      };
    })
    // Forms with the most recent activity first
    .sort((a, b) => (b.last?.getTime() ?? 0) - (a.last?.getTime() ?? 0));

  const total = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="space-y-8">
      <PageHeader title="הגשות" subtitle={`${total} הגשות ב-${rows.length} טפסים`} />

      {rows.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {rows.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/forms/${row.id}/submissions`}
                    className="flex flex-wrap items-center gap-4 px-6 py-4 transition-colors hover:bg-brand-sage-50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
                      <Inbox className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-brand-teal">{row.title}</span>
                      <span className="block text-sm text-muted-foreground">
                        {row.last ? `הגשה אחרונה: ${row.last.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}` : 'אין הגשות עדיין'}
                        {!row.is_active && ' · לא פעיל'}
                      </span>
                    </span>
                    {row.today > 0 && (
                      <span className="rounded-full bg-brand-cyan px-2.5 py-0.5 text-xs font-semibold text-brand-ink">
                        {row.today} חדשות היום
                      </span>
                    )}
                    <span className="text-2xl font-bold font-display text-brand-teal">{row.total}</span>
                    <ChevronLeft className="h-5 w-5 text-brand-sage" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Inbox className="mx-auto mb-3 h-10 w-10 text-brand-sage" />
            אין עדיין טפסים או הגשות
          </CardContent>
        </Card>
      )}
    </div>
  );
}
