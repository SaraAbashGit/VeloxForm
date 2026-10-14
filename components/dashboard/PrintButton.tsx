'use client';

import { Printer } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';

export function PrintButton({ label, ...props }: { label: string } & ButtonProps) {
  return (
    <Button type="button" onClick={() => window.print()} {...props}>
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  );
}
