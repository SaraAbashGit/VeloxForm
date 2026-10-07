import { z } from 'zod';

const fieldTypeSchema = z.enum([
  'text', 'textarea', 'number', 'email', 'phone',
  'checkbox', 'radio', 'select', 'date', 'signature', 'file_upload',
]);

export const aiFormSchemaValidator = z.object({
  form_title: z.string().min(1),
  form_description: z.string(),
  fields: z.array(
    z.object({
      type: fieldTypeSchema,
      label: z.string().min(1),
      placeholder: z.string().optional(),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
    })
  ).min(1),
});
