import { cn } from '@/lib/utils';

// Brand mark: 2x2 tiles whose quarter circles meet in the middle, matching the geometric pattern
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="0" y="0" width="20" height="20" fill="#294248" />
      <path d="M20 20 L4 20 A16 16 0 0 1 20 4 Z" fill="#64ccd0" />
      <rect x="20" y="0" width="20" height="20" fill="#879983" />
      <path d="M20 20 L20 4 A16 16 0 0 1 36 20 Z" fill="#294248" />
      <rect x="0" y="20" width="20" height="20" fill="#64ccd0" />
      <path d="M20 20 L20 36 A16 16 0 0 1 4 20 Z" fill="#294248" />
      <rect x="20" y="20" width="20" height="20" fill="#294248" />
      <path d="M20 20 L36 20 A16 16 0 0 1 20 36 Z" fill="#879983" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** "light" = white text, for dark backgrounds */
  tone?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, tone = 'dark', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { mark: 'h-6 w-6', text: 'text-base' },
    md: { mark: 'h-8 w-8', text: 'text-xl' },
    lg: { mark: 'h-10 w-10', text: 'text-2xl' },
  }[size];

  return (
    <span className={cn('inline-flex items-center gap-2', className)} dir="ltr">
      <LogoMark className={cn(sizes.mark, 'rounded-md overflow-hidden')} />
      <span
        className={cn(
          'font-display font-bold tracking-tight',
          sizes.text,
          tone === 'light' ? 'text-white' : 'text-brand-teal'
        )}
      >
        Form<span className={tone === 'light' ? 'text-brand-cyan' : 'text-brand-cyan-700'}>AI</span>
      </span>
    </span>
  );
}
