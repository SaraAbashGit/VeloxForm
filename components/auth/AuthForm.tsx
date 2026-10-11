'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AuthState } from '@/app/(auth)/actions';

type AuthAction = (prev: AuthState, formData: FormData) => Promise<AuthState>;

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

// Wraps an auth server action so its error / success message is shown above the submit button
export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  children,
}: {
  action: AuthAction;
  submitLabel: string;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state?.error && (
        <p role="alert" className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="flex items-center gap-2 rounded-md bg-brand-cyan-50 px-3 py-2 text-sm text-brand-cyan-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.success}
        </p>
      )}
      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
