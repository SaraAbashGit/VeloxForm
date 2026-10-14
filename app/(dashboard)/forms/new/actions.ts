'use server';

import { isRateLimited, LIMITS, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';
import { AIFormSchema } from '@/types/form';
import { aiFormSchemaValidator, AI_FIELD_FORMAT } from '@/lib/validations/ai-form-schema';
import { askAiJson } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';
import { isClientUser } from '@/lib/auth/roles';
import { attachmentError, ATTACHMENT_NOTE, type AiAttachment } from '@/lib/ai-attachment';

type GenerateResult = { ok: true; form: AIFormSchema } | { ok: false; error: string };

const SYSTEM_PROMPT = `You are an expert digital form structure generator.
Return ONLY a raw, valid JSON object matching the structure below with no markdown styling, wrappers, or text explanations:
${AI_FIELD_FORMAT}
Crucial Instructions: Always append a "signature" type field automatically at the end of the form if the input implies a declaration, waiver, contract, agreement, or formal signup.`;

export async function generateFormFromPrompt(
  userPrompt: string,
  attachment: AiAttachment | null = null
): Promise<GenerateResult> {
  const { limit, windowMs } = LIMITS.generateForm;
  if (isRateLimited('generateFormFromPrompt', limit, windowMs)) return { ok: false, error: RATE_LIMIT_MESSAGE };

  // Only business owners may spend AI quota
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user || isClientUser(user)) return { ok: false, error: 'יש להתחבר כבעל עסק' };

  const prompt = userPrompt.trim().slice(0, 2000);
  if (!prompt && !attachment) return { ok: false, error: 'יש להזין תיאור לטופס או לצרף תמונה/קובץ' };
  const badAttachment = attachmentError(attachment);
  if (badAttachment) return { ok: false, error: badAttachment };

  const request = attachment
    ? `${prompt || 'Build a form based on the attachment.'}\n\n${ATTACHMENT_NOTE}`
    : prompt;
  const result = await askAiJson(SYSTEM_PROMPT, request, aiFormSchemaValidator, { attachment });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.includes('עמוס') ? result.error : 'שגיאה ביצירת הטופס. נסי לנסח את התיאור מחדש.',
    };
  }
  return { ok: true, form: result.data as AIFormSchema };
}
