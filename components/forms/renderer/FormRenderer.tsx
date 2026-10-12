'use client';

import { useForm } from 'react-hook-form';
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {fields.map((field) => (
        <div key={field.id}>
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
