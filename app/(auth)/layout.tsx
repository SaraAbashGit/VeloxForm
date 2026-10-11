import Link from 'next/link';
import { GeometricPattern } from '@/components/brand/GeometricPattern';
import { Logo } from '@/components/brand/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface md:grid md:grid-cols-2">
      {/* Mobile: a thin decorative strip above the form */}
      <div className="md:hidden h-20 overflow-hidden">
        <GeometricPattern className="h-full w-full" />
      </div>
      <div className="relative">
        <div className="absolute top-6 inset-x-0 flex justify-center z-10">
          <Link href="/login">
            <Logo size="lg" />
          </Link>
        </div>
        {children}
      </div>
      {/* Desktop: decorative panel beside the form */}
      <div className="hidden md:block relative overflow-hidden">
        <GeometricPattern className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  );
}
