'use server';

import { isRateLimited, LIMITS, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';
import { askAiJson } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';
import { isClientUser } from '@/lib/auth/roles';
import { aiFormSchemaValidator, AI_FIELD_FORMAT } from '@/lib/validations/ai-form-schema';
import { aiFieldsToFormFields } from '@/lib/ai-form-fields';
import type { FormField } from '@/types/form';
import { attachmentError, ATTACHMENT_NOTE, type AiAttachment } from '@/lib/ai-attachment';

const SYSTEM_PROMPT = `You edit an existing digital form according to the user's request.
You receive the current form as JSON. Apply ONLY the requested changes and keep everything else exactly as it is.
Every existing field has a "key": copy it unchanged for fields you keep or modify. Give new fields a new unique key.
Return ONLY a raw, valid JSON object with no markdown, in this structure:
${AI_FIELD_FORMAT}
Keep the language of the form (usually Hebrew) unless the user asks to change it.`;

type RefineResult =
  | { ok: true; title: string; description: string; fields: FormField[] }
  | { ok: false; error: string };

export async function refineFormWithAi(
  formId: string,
  instruction: string,
  current: { title: string; description?: string; fields: FormField[] },
  attachment: AiAttachment | null = null
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
  if (!request && !attachment) return { ok: false, error: 'כתבי מה לשנות בטופס' };
  const badAttachment = attachmentError(attachment);
  if (badAttachment) return { ok: false, error: badAttachment };

  // Existing fields are keyed by their id, so the answer can be matched back to them
  const currentJson = JSON.stringify({
    form_title: current.title,
    form_description: current.description ?? '',
    fields: current.fields.map((f) => ({
      key: f.id,
      type: f.type,
      label: f.label,
      placeholder: f.placeholder,
      required: f.required,
      options: f.options,
      show_if: f.show_if ? { key: f.show_if.field_id, equals: f.show_if.equals } : null,
    })),
  });

  const result = await askAiJson(
    SYSTEM_PROMPT,
    `Current form:\n${currentJson}\n\nRequested change:\n${request || 'Update the form according to the attachment.'}` +
      (attachment ? `\n\n${ATTACHMENT_NOTE}` : ''),
    aiFormSchemaValidator,
    { attachment }
  );
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.includes('עמוס') ? result.error : 'ה-AI לא הצליח לעדכן את הטופס. נסי לנסח את הבקשה אחרת.',
    };
  }

  const fields = aiFieldsToFormFields(result.data.fields, formId, new Set(current.fields.map((f) => f.id)));
  return { ok: true, title: result.data.form_title, description: result.data.form_description, fields };
}
