import { GeometricPattern } from '@/components/brand/GeometricPattern';
import { LogoMark } from '@/components/brand/Logo';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Shows the brand mark beside the title */
  withLogo?: boolean;
  action?: React.ReactNode;
}

// Dark brand band shared by all dashboard pages
export function PageHeader({ title, subtitle, withLogo, action }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-brand-ink text-white">
      <GeometricPattern className="absolute inset-y-0 left-0 h-full w-40 hidden sm:block" />
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:pl-48">
        <div className="flex items-center gap-4">
          {withLogo && <LogoMark className="h-12 w-12 shrink-0 rounded-lg overflow-hidden" />}
          <div>
            <h1 className="text-3xl font-bold font-display">{title}</h1>
            {subtitle && <p className="text-brand-sage mt-1">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}
