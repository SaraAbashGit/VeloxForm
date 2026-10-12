'use server';

import { isRateLimited, LIMITS, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit';
import { AIFormSchema } from '@/types/form';
import { aiFormSchemaValidator } from '@/lib/validations/ai-form-schema';
import { askAiJson } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';
import { isClientUser } from '@/lib/auth/roles';

type GenerateResult = { ok: true; form: AIFormSchema } | { ok: false; error: string };

const SYSTEM_PROMPT = `You are an expert digital form structure generator.
Return ONLY a raw, valid JSON object matching the structure below with no markdown styling, wrappers, or text explanations:
{
  "form_title": "string",
  "form_description": "string",
  "fields": [
    {
      "type": "text|textarea|number|email|phone|checkbox|radio|select|date|signature|file_upload",
      "label": "string",
      "placeholder": "string",
      "required": true|false,
      "options": ["option1","option2"]
    }
  ]
}
Crucial Instructions: Always append a "signature" type field automatically at the end of the form if the input implies a declaration, waiver, contract, agreement, or formal signup.`;

export async function generateFormFromPrompt(userPrompt: string): Promise<GenerateResult> {
  const { limit, windowMs } = LIMITS.generateForm;
  if (isRateLimited('generateFormFromPrompt', limit, windowMs)) return { ok: false, error: RATE_LIMIT_MESSAGE };

  // Only business owners may spend AI quota
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user || isClientUser(user)) return { ok: false, error: 'יש להתחבר כבעל עסק' };

  const prompt = userPrompt.trim().slice(0, 2000);
  if (!prompt) return { ok: false, error: 'יש להזין תיאור לטופס' };

  const result = await askAiJson(SYSTEM_PROMPT, prompt, aiFormSchemaValidator);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.includes('עמוס') ? result.error : 'שגיאה ביצירת הטופס. נסי לנסח את התיאור מחדש.',
    };
  }
  return { ok: true, form: result.data as AIFormSchema };
}
