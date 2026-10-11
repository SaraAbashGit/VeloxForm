'use client';

import { useState, useTransition } from 'react';
import { FormRenderer } from '@/components/forms/renderer/FormRenderer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { submitForm } from './actions';
import type { Form, FormField } from '@/types/form';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { GeometricPattern } from '@/components/brand/GeometricPattern';

interface PublicFormClientProps {
  form: Form;
  fields: FormField[];
}

export function PublicFormClient({ form, fields }: PublicFormClientProps) {
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
        <FormRenderer fields={fields} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </CardContent>
    </Card>
  );
}
