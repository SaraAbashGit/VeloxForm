// An image or PDF the business owner attaches to an AI request (e.g. a photo of a paper form).
// Shared by the browser (picking/compressing the file) and the server (checking it again).

export interface AiAttachment {
  name: string;
  mimeType: string;
  /** File contents, base64 without the "data:" prefix */
  base64: string;
}

export const AI_ATTACHMENT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
// Server actions accept up to 4MB (next.config) and base64 adds a third, so the file itself stays under 2.5MB
export const AI_ATTACHMENT_MAX_BYTES = 2.5 * 1024 * 1024;

export function attachmentError(attachment: AiAttachment | null | undefined): string | null {
  if (!attachment) return null;
  if (!AI_ATTACHMENT_TYPES.includes(attachment.mimeType)) return 'אפשר לצרף רק תמונה (PNG, JPG, WEBP) או קובץ PDF';
  if (typeof attachment.base64 !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(attachment.base64)) return 'הקובץ המצורף פגום';
  if ((attachment.base64.length * 3) / 4 > AI_ATTACHMENT_MAX_BYTES) return 'הקובץ גדול מדי (עד 2.5MB)';
  return null;
}

/** Prompt note telling the model how to use the attachment */
export const ATTACHMENT_NOTE =
  'An image or document is attached (for example a photo or scan of an existing paper form). ' +
  'Use it as a source: include its fields, options and wording where relevant to the request. ' +
  'Write the form in Hebrew unless the request says otherwise.';
