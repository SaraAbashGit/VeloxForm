import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface RecentActivityProps {
  submissions: {
    id: string;
    submitted_at: string;
    form_id: string;
    forms: { title: string } | null;
  }[];
}

export function RecentActivity({ submissions }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="rounded-md bg-brand-600 p-1.5 text-white">
            <Clock className="h-4 w-4" />
          </span>
          פעילות אחרונה
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length > 0 ? (
          <ul className="space-y-3">
            {submissions.map((sub) => (
              <li key={sub.id} className="flex justify-between text-sm">
                <span>{sub.forms?.title ?? 'טופס'}</span>
                <span className="text-muted-foreground">
                  {new Date(sub.submitted_at).toLocaleDateString('he-IL')}
                </span>
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
