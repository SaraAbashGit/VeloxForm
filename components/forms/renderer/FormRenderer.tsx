'use client';

import { useForm, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildDynamicFormSchema } from '@/lib/validations/dynamic-form';
import { FieldRenderer } from '@/components/forms/fields/FieldRenderer';
import { Button } from '@/components/ui/button';
import type { FormField } from '@/types/form';

interface FormRendererProps {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting?: boolean;
  /** Values that override field defaults, e.g. a signed-in customer's name and email */
  initialValues?: Record<string, string>;
}

export function FormRenderer({ fields, onSubmit, isSubmitting, initialValues }: FormRendererProps) {
  const schema = buildDynamicFormSchema(fields);
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(fields.map((f) => [f.id, initialValues?.[f.id] ?? f.default_value ?? ''])),
  });

  // On a long form the first error can be off-screen: say so and scroll to it
  const onInvalid = (formErrors: FieldErrors) => {
    const first = fields.find((f) => formErrors[f.id]);
    toast.error(first ? `יש למלא את השדה: ${first.label}` : 'יש שדות שלא מולאו כראוי');
    if (first) document.getElementById(`field-${first.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      {fields.map((field) => (
        <div key={field.id} id={`field-${field.id}`}>
          <FieldRenderer field={field} control={control} />
          {errors[field.id] && (
            <p className="text-sm text-destructive mt-1">
              {errors[field.id]?.message as string}
            </p>
          )}
        </div>
      ))}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'שולח...' : 'שלח טופס'}
      </Button>
    </form>
  );
}
