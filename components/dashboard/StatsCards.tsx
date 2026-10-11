import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, Inbox } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  formCount: number;
  submissionCount: number;
}

// Each card gets its own palette color so the dashboard is not monochrome
const cardStyles = {
  cyan: { card: 'border-t-4 border-t-brand-cyan', icon: 'bg-brand-cyan text-brand-ink' },
  teal: { card: 'border-t-4 border-t-brand-teal', icon: 'bg-brand-teal text-white' },
  sage: { card: 'border-t-4 border-t-brand-sage', icon: 'bg-brand-sage text-brand-ink' },
};

function StatCard({
  title,
  icon: Icon,
  tone,
  href,
  children,
}: {
  title: string;
  icon: React.ElementType;
  tone: keyof typeof cardStyles;
  href?: string;
  children: React.ReactNode;
}) {
  const card = (
    <Card className={cn(cardStyles[tone].card, href && 'h-full transition-shadow hover:shadow-md')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className={cn('rounded-full p-1.5', cardStyles[tone].icon)}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export function StatsCards({ formCount, submissionCount }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard title="סה״כ טפסים" icon={FileText} tone="cyan" href="/forms">
        <div className="text-3xl font-bold">{formCount}</div>
      </StatCard>
      <StatCard title="סה״כ הגשות" icon={Inbox} tone="teal" href="/forms">
        <div className="text-3xl font-bold">{submissionCount}</div>
      </StatCard>
      <StatCard title="סטטוס" icon={CheckCircle} tone="sage">
        <div className="text-3xl font-bold text-green-700">פעיל</div>
      </StatCard>
    </div>
  );
}
