'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutDashboard, Plus, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { signOut } from '@/app/(auth)/actions';

const navItems = [
  { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { href: '/forms/new', label: 'טופס חדש', icon: Plus },
  { href: '/profile', label: 'פרופיל', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-l bg-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <Link href="/dashboard" className="text-xl font-bold font-display text-brand-500">
          FormAI
        </Link>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-brand-50 text-brand-600'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <form action={signOut}>
        <Button variant="ghost" className="w-full justify-start gap-3" type="submit">
          <LogOut className="h-4 w-4" />
          התנתק
        </Button>
      </form>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-white flex justify-around p-2 z-50">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-col items-center gap-1 p-2 text-xs',
            pathname.startsWith(href) ? 'text-brand-500' : 'text-muted-foreground'
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
