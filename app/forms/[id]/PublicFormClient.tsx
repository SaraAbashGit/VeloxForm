'use client';

import { useState, useTransition } from 'react';
import { FormRenderer } from '@/components/forms/renderer/FormRenderer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { submitForm } from './actions';
import type { Form, FormField } from '@/types/form';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

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
      <Card className="max-w-lg mx-auto text-center">
        <CardContent className="pt-12 pb-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-display mb-2">תודה!</h2>
          <p className="text-muted-foreground">הטופס נשלח בהצלחה</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-display">{form.title}</CardTitle>
        {form.description && <CardDescription>{form.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <FormRenderer fields={fields} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </CardContent>
    </Card>
  );
}
