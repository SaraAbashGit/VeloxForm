import Link from 'next/link';
import { FileText, Pencil, Inbox, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { CopyLinkButton } from '@/components/dashboard/CopyLinkButton';
import { cn } from '@/lib/utils';

export default async function FormsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: forms } = await supabase
    .from('forms')
    .select('id, title, description, slug, is_active, created_at, submissions(count)')
    // RLS also lets anyone read active forms (for the public page), so filter by owner explicitly
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        title="הטפסים שלי"
        subtitle={forms?.length ? `${forms.length} טפסים` : 'עדיין אין טפסים'}
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

      {forms && forms.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => {
            const submissionCount = (form.submissions as { count: number }[])[0]?.count ?? 0;
            return (
              <Card key={form.id} className="flex flex-col border-t-4 border-t-brand-teal">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-snug">{form.title}</CardTitle>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        form.is_active ? 'bg-brand-cyan-50 text-brand-cyan-700' : 'bg-brand-sage-50 text-muted-foreground'
                      )}
                    >
                      {form.is_active ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </div>
                  {form.description && <CardDescription className="line-clamp-2">{form.description}</CardDescription>}
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {submissionCount} הגשות · נוצר {new Date(form.created_at).toLocaleDateString('he-IL')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={`/forms/${form.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                        עריכה
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/forms/${form.id}/submissions`}>
                        <Inbox className="h-4 w-4" />
                        הגשות
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/forms/${form.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                        צפייה
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-sage-50">
              <FileText className="h-8 w-8 text-brand-teal" />
            </span>
            <h2 className="text-xl font-bold font-display">בואו ניצור את הטופס הראשון שלך</h2>
            <p className="mt-1 text-muted-foreground">מתארים במילים, וה-AI בונה את הטופס</p>
            <Button asChild className="mt-6">
              <Link href="/forms/new">+ טופס חדש עם AI</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
