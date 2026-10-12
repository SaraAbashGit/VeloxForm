import Link from 'next/link';
import { FolderOpen, UserRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { clientName, isClientUser } from '@/lib/auth/roles';

// Strip at the top of public pages: invites customers to sign in, or links a signed-in customer to their documents
export function ClientBar({ user, next }: { user: User | null; next: string }) {
  const encodedNext = encodeURIComponent(next);

  return (
    <div className="bg-brand-teal text-white">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        {user && isClientUser(user) ? (
          <>
            <span className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-brand-cyan" />
              שלום, {clientName(user)}
            </span>
            <Link href="/my" className="flex items-center gap-1 font-semibold text-brand-cyan hover:underline">
              <FolderOpen className="h-4 w-4" />
              המסמכים שלי
            </Link>
          </>
        ) : (
          <>
            <span className="text-white/80">רוצים לשמור את כל המסמכים שלכם במקום אחד?</span>
            <span className="flex items-center gap-3">
              <Link href={`/client/login?next=${encodedNext}`} className="font-semibold hover:underline">
                התחברות
              </Link>
              <Link
                href={`/client/register?next=${encodedNext}`}
                className="rounded-full bg-brand-cyan px-3 py-1 font-semibold text-brand-ink hover:bg-brand-cyan-hover"
              >
                הרשמה
              </Link>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
