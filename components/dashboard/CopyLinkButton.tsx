'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';

// Copies an app path as a full URL (works on localhost and on the deployed domain)
export function CopyLinkButton({ path, label, ...props }: { path: string; label: string } & ButtonProps) {
  const copy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    toast.success('הקישור הועתק');
  };

  return (
    <Button type="button" onClick={copy} {...props}>
      <Copy className="h-4 w-4" />
      {label}
    </Button>
  );
}
