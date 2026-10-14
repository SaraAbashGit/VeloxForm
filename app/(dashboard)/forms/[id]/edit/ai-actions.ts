'use server';

import { z } from 'zod';
import { isRateLimited, LIMITS, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';
import { askAiJson } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';
import { isClientUser } from '@/lib/auth/roles';
import { aiFormSchemaValidator } from '@/lib/validations/ai-form-schema';
import type { FormField } from '@/types/form';

const SYSTEM_PROMPT = `You edit an existing digital form according to the user's request.
You receive the current form as JSON. Apply ONLY the requested changes and keep everything else exactly as it is.
Return ONLY a raw, valid JSON object with no markdown, in this structure:
{
  "form_title": "string",
  "form_description": "string",
  "fields": [
    {
      "id": "string (copy the id of an existing field you keep or modify; omit for new fields)",
      "type": "text|textarea|number|email|phone|checkbox|radio|select|date|signature|file_upload",
      "label": "string",
      "placeholder": "string",
      "required": true|false,
      "options": ["option1","option2"]
    }
  ]
}
Keep the language of the form (usually Hebrew) unless the user asks to change it.`;

const refineSchema = aiFormSchemaValidator.extend({
  fields: z
    .array(aiFormSchemaValidator.shape.fields.element.extend({ id: z.string().optional() }))
    .min(1),
});

type RefineResult =
  | { ok: true; title: string; description: string; fields: FormField[] }
  | { ok: false; error: string };

export async function refineFormWithAi(
  formId: string,
  instruction: string,
  current: { title: string; description?: string; fields: FormField[] }
): Promise<RefineResult> {
  const { limit, windowMs } = LIMITS.generateForm;
  if (isRateLimited('refineFormWithAi', limit, windowMs)) return { ok: false, error: RATE_LIMIT_MESSAGE };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || isClientUser(user)) return { ok: false, error: 'יש להתחבר כבעל עסק' };

  // Only the owner of the form may spend AI quota on it
  const { data: form } = await supabase.from('forms').select('id').eq('id', formId).eq('user_id', user.id).single();
  if (!form) return { ok: false, error: 'הטופס לא נמצא' };

  const request = instruction.trim().slice(0, 1000);
  if (!request) return { ok: false, error: 'כתבי מה לשנות בטופס' };

  const currentJson = JSON.stringify({
    form_title: current.title,
    form_description: current.description ?? '',
    fields: current.fields.map(({ id, type, label, placeholder, required, options }) => ({
      id, type, label, placeholder, required, options,
    })),
  });

  const result = await askAiJson(
    SYSTEM_PROMPT,
    `Current form:\n${currentJson}\n\nRequested change:\n${request}`,
    refineSchema
  );
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.includes('עמוס') ? result.error : 'ה-AI לא הצליח לעדכן את הטופס. נסי לנסח את הבקשה אחרת.',
    };
  }

  // Keep the ids of existing fields (stable answers and order); anything else is a new field
  const knownIds = new Set(current.fields.map((f) => f.id));
  const usedIds = new Set<string>();
  const fields: FormField[] = result.data.fields.map((f, i) => {
    const keepId = f.id && knownIds.has(f.id) && !usedIds.has(f.id);
    const id = keepId ? f.id! : crypto.randomUUID();
    usedIds.add(id);
    return {
      id,
      form_id: formId,
      type: f.type,
      label: f.label,
      placeholder: f.placeholder,
      required: f.required,
      options: f.options,
      field_order: i,
    };
  });

  return { ok: true, title: result.data.form_title, description: result.data.form_description, fields };
}
