import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface RecentActivityProps {
  submissions: {
    id: string;
    submitted_at: string;
    form_id: string;
    forms: { title: string } | null;
  }[];
  /** submission id → who filled it (see lib/submitters) */
  names?: Record<string, string>;
}

export function RecentActivity({ submissions, names = {} }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="rounded-full bg-brand-600 p-1.5 text-white">
            <Clock className="h-4 w-4" />
          </span>
          פעילות אחרונה
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length > 0 ? (
          <ul className="space-y-1">
            {submissions.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`/forms/${sub.form_id}/submissions/${sub.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg p-2 text-sm hover:bg-muted"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-cyan" />
                    <span className="truncate">
                      <span className="font-semibold text-brand-teal">{names[sub.id] ?? 'מישהו'}</span> מילא/ה את{' '}
                      {sub.forms?.title ?? 'טופס'}
                    </span>
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {new Date(sub.submitted_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>אין פעילות עדיין</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
