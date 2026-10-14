import OpenAI from 'openai';
import type { z } from 'zod';

// OPENAI_BASE_URL / OPENAI_MODEL allow any OpenAI-compatible provider (e.g. Gemini) during development.
// Leave them unset to use OpenAI gpt-4o as defined in the spec.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

const MAX_ATTEMPTS = 3;
// 429 = rate limit / daily quota, 5xx = provider overloaded/unavailable; both are usually temporary
const isTemporaryError = (status?: number) => status === 429 || (!!status && status >= 500);

// Free tiers have a daily quota per model, so when one model is exhausted or overloaded we move on to the next.
// OPENAI_FALLBACK_MODELS (comma separated) overrides the defaults; with OpenAI itself there are none by default.
const PRIMARY_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const FALLBACK_MODELS = (
  process.env.OPENAI_FALLBACK_MODELS ??
  (process.env.OPENAI_BASE_URL?.includes('generativelanguage') ? 'gemini-flash-latest,gemini-flash-lite-latest' : '')
)
  .split(',')
  .map((m) => m.trim())
  .filter((m) => m && m !== PRIMARY_MODEL);
const MODELS = [PRIMARY_MODEL, ...FALLBACK_MODELS];

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Asks the model for a JSON object and validates it with zod. Retries temporary provider errors
 * and returns a result object (Next.js hides thrown error messages from the browser in production).
 */
export async function askAiJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>, // T is the parsed (output) type
  options: { temperature?: number } = {}
): Promise<AiResult<T>> {
  let modelIndex = 0;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS + FALLBACK_MODELS.length; attempt++) {
    const model = MODELS[modelIndex];
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
        temperature: options.temperature ?? 0.3,
      });
      const raw = response.choices[0].message.content ?? '';
      return { ok: true, data: schema.parse(JSON.parse(raw)) };
    } catch (error) {
      const status = (error as { status?: number }).status;
      console.error(`AI request failed (model ${model}, attempt ${attempt}):`, error);
      const hasNextModel = modelIndex < MODELS.length - 1;
      // Quota / overload / bad answer on this model: switch to the next one right away
      if (hasNextModel) {
        modelIndex++;
        continue;
      }
      // Last model and a temporary error: wait a little and try it again
      if (isTemporaryError(status) && attempt < MAX_ATTEMPTS + FALLBACK_MODELS.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      return {
        ok: false,
        error: isTemporaryError(status)
          ? 'שירות ה-AI עמוס כרגע. נסו שוב בעוד דקה.'
          : 'ה-AI לא הצליח לענות הפעם. נסו שוב.',
      };
    }
  }
  return { ok: false, error: 'ה-AI לא הצליח לענות הפעם. נסו שוב.' };
}
