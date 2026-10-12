'use client';

import { useState, useTransition } from 'react';
import { FormRenderer } from '@/components/forms/renderer/FormRenderer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { submitForm } from './actions';
import type { Form, FormField } from '@/types/form';
import { toast } from 'sonner';
import Link from 'next/link';
import { Check, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeometricPattern } from '@/components/brand/GeometricPattern';

interface PublicFormClientProps {
  form: Form;
  fields: FormField[];
  prefill?: Record<string, string>;
  isClient?: boolean;
}

export function PublicFormClient({ form, fields, prefill, isClient }: PublicFormClientProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, startSubmit] = useTransition();

  const handleSubmit = (data: Record<string, unknown>) => {
    startSubmit(async () => {
      try {
        await submitForm(form.slug, data);
        setSubmitted(true);
        toast.success('הטופס נשלח בהצלחה!');
      } catch {
        toast.error('שגיאה בשליחת הטופס');
      }
    });
  };

  if (submitted) {
    return (
      <Card className="max-w-lg mx-auto overflow-hidden text-center">
        <div className="h-12 overflow-hidden">
          <GeometricPattern className="h-full w-full" />
        </div>
        <CardContent className="pt-12 pb-12">
          <span className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-cyan">
            <Check className="h-10 w-10 text-brand-ink" strokeWidth={3} />
          </span>
          <h2 className="text-2xl font-bold font-display mb-2">תודה! הטופס נשלח בהצלחה</h2>
          <p className="text-muted-foreground">{form.title} · {new Date().toLocaleDateString('he-IL')}</p>
          <div className="mt-6 flex flex-col items-center gap-3">
            {isClient ? (
              <Button asChild>
                <Link href="/my">
                  <FolderOpen className="h-4 w-4" />
                  למסמכים שלי
                </Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                בפעם הבאה{' '}
                <Link href={`/client/register?next=/forms/${form.slug}`} className="font-semibold text-brand-cyan-700 hover:underline">
                  הירשמו
                </Link>{' '}
                כדי לשמור את כל המסמכים שלכם במקום אחד
              </p>
            )}
            <Link href={`/b/${form.user_id}`} className="text-sm text-brand-cyan-700 hover:underline">
              לכל הטפסים של העסק
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto overflow-hidden">
      <div className="h-16 overflow-hidden">
        <GeometricPattern className="h-full w-full" />
      </div>
      <CardHeader className="bg-brand-teal text-white">
        <CardTitle className="font-display">{form.title}</CardTitle>
        {form.description && <CardDescription className="text-white/80">{form.description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-6">
        <FormRenderer fields={fields} onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={prefill} />
      </CardContent>
    </Card>
  );
}
