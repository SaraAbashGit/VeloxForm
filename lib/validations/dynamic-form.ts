import { z } from 'zod';
import type { FormField } from '@/types/form';

export function buildDynamicFormSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case 'email':
        schema = z.string().email('כתובת אימייל לא תקינה');
        break;
      case 'number':
        schema = z.coerce.number({ invalid_type_error: 'יש להזין מספר' });
        break;
      case 'checkbox':
        schema = z.union([z.boolean(), z.array(z.string())]);
        break;
      case 'signature':
      case 'file_upload':
        schema = z.string().min(1, 'שדה חובה');
        break;
      default:
        schema = z.string();
    }

    if (!field.required) {
      schema = schema.optional().or(z.literal(''));
    } else if (field.type !== 'checkbox') {
      schema = (schema as z.ZodString).min(1, 'שדה חובה');
    }

    shape[field.id] = schema;
  }

  return z.object(shape);
}

export type DynamicFormValues = Record<string, string | number | boolean | string[] | undefined>;
