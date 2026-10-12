'use client';

import { useTransition } from 'react';
import { FileWarning, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { regeneratePdf } from '@/app/(dashboard)/forms/[id]/submissions/pdf-actions';

export function RegeneratePdfButton({ formId, submissionId }: { formId: string; submissionId: string }) {
  const [isPending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const result = await regeneratePdf(formId, submissionId);
      if (result.ok) toast.success('ה-PDF נוצר');
      else toast.error(result.error ?? 'יצירת ה-PDF נכשלה');
    });

  return (
    <Button type="button" size="sm" variant="ghost" onClick={run} disabled={isPending}>
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileWarning className="h-4 w-4" />}
      {isPending ? 'יוצר...' : 'צור PDF'}
    </Button>
  );
}
