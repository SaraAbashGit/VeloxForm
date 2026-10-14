import { z } from 'zod';

const fieldTypeSchema = z.enum([
  'text', 'textarea', 'number', 'email', 'phone',
  'checkbox', 'radio', 'select', 'date', 'signature', 'file_upload',
]);

// The model sometimes sends null (or nothing) instead of leaving a key out; accept that rather than fail
const optionalString = z.string().nullish().transform((v) => v ?? undefined);

export const aiFormSchemaValidator = z.object({
  form_title: z.string().min(1),
  form_description: optionalString.transform((v) => v ?? ''),
  fields: z.array(
    z.object({
      type: fieldTypeSchema,
      label: z.string().min(1),
      placeholder: optionalString,
      required: z.boolean().nullish().transform((v) => !!v),
      options: z.array(z.coerce.string()).nullish().transform((v) => v ?? undefined),
      key: z.coerce.string().nullish().transform((v) => v ?? undefined),
      show_if: z
        .object({ key: z.coerce.string(), equals: z.coerce.string() })
        .nullish()
        .transform((v) => v ?? null),
    })
  ).min(1),
});

/** Shared prompt text: how the model describes fields, including conditional ("show only if") fields */
export const AI_FIELD_FORMAT = `{
  "form_title": "string",
  "form_description": "string",
  "fields": [
    {
      "key": "string (a unique short name for the field)",
      "type": "text|textarea|number|email|phone|checkbox|radio|select|date|signature|file_upload",
      "label": "string",
      "placeholder": "string",
      "required": true|false,
      "options": ["option1","option2"],
      "show_if": { "key": "key of another field", "equals": "one of that field's options" } or null
    }
  ]
}
Conditional fields: when a field should appear only after a certain answer (e.g. only for a specific choice),
set "show_if" to the key of a radio/select/checkbox field and the exact option text that reveals it.
Fields that should always be shown have "show_if": null. Put a controlling field before the fields it reveals.`;
