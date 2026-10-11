'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutDashboard, Plus, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { signOut } from '@/app/(auth)/actions';
import { Logo } from '@/components/brand/Logo';

const navItems = [
  { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { href: '/forms', label: 'הטפסים שלי', icon: FileText },
  { href: '/forms/new', label: 'טופס חדש', icon: Plus },
  { href: '/profile', label: 'פרופיל', icon: User },
];

// The most specific matching item wins, so /forms/new highlights "טופס חדש" and not "הטפסים שלי"
function activeHref(pathname: string) {
  return navItems
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(href + '/'))
    .sort((a, b) => b.length - a.length)[0];
}

export function Sidebar() {
  const active = activeHref(usePathname());

  return (
    <aside className="w-64 bg-brand-600 h-screen p-4 flex flex-col sticky top-0">
      <div className="mb-8 px-1">
        <Link href="/dashboard">
          <Logo tone="light" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              href === active
                ? 'bg-brand-teal text-brand-cyan font-medium'
                : 'text-brand-100 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <form action={signOut}>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-brand-100 hover:bg-white/10 hover:text-white"
          type="submit"
        >
          <LogOut className="h-4 w-4" />
          התנתק
        </Button>
      </form>
    </aside>
  );
}

export function MobileNav() {
  const active = activeHref(usePathname());
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-brand-600 flex justify-around p-2 z-50">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-col items-center gap-1 p-2 text-xs rounded-lg',
            href === active ? 'bg-brand-teal text-brand-cyan' : 'text-brand-100'
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
