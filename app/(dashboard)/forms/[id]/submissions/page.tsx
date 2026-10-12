import { createClient } from '@/lib/supabase/server';
import { APP_URL } from '@/lib/app-url';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inbox, ExternalLink } from 'lucide-react';

export default async function SubmissionsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user?.id)
    .single();

  if (!form) notFound();

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, submitted_at, pdf_url')
    .eq('form_id', params.id)
    .order('submitted_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">הגשות — {form.title}</h1>
          <p className="text-muted-foreground">{submissions?.length ?? 0} הגשות</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/forms/${form.id}/edit`}>חזרה לעריכה</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Inbox className="h-5 w-5" />
            רשימת הגשות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions && submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      {new Date(sub.submitted_at).toLocaleString('he-IL')}
                    </TableCell>
                    <TableCell>
                      {sub.pdf_url ? (
                        <Badge variant="default">זמין</Badge>
                      ) : (
                        <Badge variant="secondary">לא זמין</Badge>
                      )}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/forms/${params.id}/submissions/${sub.id}`}>צפייה</Link>
                      </Button>
                      {sub.pdf_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/forms/${params.id}/submissions/${sub.id}/pdf`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>אין הגשות עדיין</p>
              <p className="text-sm mt-1">
                שתף את הקישור: {APP_URL}/forms/{form.slug}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
