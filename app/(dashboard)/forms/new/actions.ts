'use server';

import OpenAI from 'openai';
import { AIFormSchema } from '@/types/form';
import { aiFormSchemaValidator } from '@/lib/validations/ai-form-schema';

// OPENAI_BASE_URL / OPENAI_MODEL allow any OpenAI-compatible provider (e.g. Gemini) during development.
// Leave them unset to use OpenAI gpt-4o as defined in the spec.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

type GenerateResult = { ok: true; form: AIFormSchema } | { ok: false; error: string };

const MAX_ATTEMPTS = 3;
// 429 = rate limit, 5xx = provider overloaded/unavailable; both are usually temporary
const isTemporaryError = (status?: number) => status === 429 || (!!status && status >= 500);

// Returns a result object instead of throwing, because Next.js hides thrown error messages from the client in production
export async function generateFormFromPrompt(userPrompt: string): Promise<GenerateResult> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return { ok: true, form: await requestForm(userPrompt) };
    } catch (error) {
      const status = (error as { status?: number }).status;
      console.error(`AI form generation failed (attempt ${attempt}/${MAX_ATTEMPTS}):`, error);
      if (isTemporaryError(status) && attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
        continue;
      }
      return {
        ok: false,
        error: isTemporaryError(status)
          ? 'שירות ה-AI עמוס כרגע. נסי שוב בעוד דקה.'
          : 'שגיאה ביצירת הטופס. נסי לנסח את התיאור מחדש.',
      };
    }
  }
  return { ok: false, error: 'שגיאה ביצירת הטופס' };
}

async function requestForm(userPrompt: string): Promise<AIFormSchema> {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert digital form structure generator.
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
Crucial Instructions: Always append a "signature" type field automatically at the end of the form if the input implies a declaration, waiver, contract, agreement, or formal signup.`,
      },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const raw = response.choices[0].message.content!;
  const parsed = JSON.parse(raw);
  return aiFormSchemaValidator.parse(parsed);
}
