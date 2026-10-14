'use client';

import { useRef } from 'react';
import { FileText, ImageIcon, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AI_ATTACHMENT_MAX_BYTES, AI_ATTACHMENT_TYPES, type AiAttachment } from '@/lib/ai-attachment';

const MAX_IMAGE_SIDE = 1600;

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Phone photos are often several MB: shrink large images to a JPEG that is plenty for the AI to read
async function shrinkImage(file: File): Promise<{ mimeType: string; dataUrl: string }> {
  const dataUrl = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
  if (scale === 1 && file.size < 1024 * 1024) return { mimeType: file.type, dataUrl };

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff'; // transparent PNGs would turn black as JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { mimeType: 'image/jpeg', dataUrl: canvas.toDataURL('image/jpeg', 0.85) };
}

/** Turns a picked or pasted file into an attachment, or explains why it can't be used */
export async function fileToAttachment(file: File): Promise<AiAttachment | null> {
  if (!AI_ATTACHMENT_TYPES.includes(file.type)) {
    toast.error('אפשר לצרף רק תמונה (PNG, JPG, WEBP) או קובץ PDF');
    return null;
  }
  try {
    const { mimeType, dataUrl } = file.type.startsWith('image/')
      ? await shrinkImage(file)
      : { mimeType: file.type, dataUrl: await readAsDataUrl(file) };
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    if ((base64.length * 3) / 4 > AI_ATTACHMENT_MAX_BYTES) {
      toast.error('הקובץ גדול מדי (עד 2.5MB)');
      return null;
    }
    return { name: file.name || 'תמונה מודבקת', mimeType, base64 };
  } catch {
    toast.error('לא הצלחנו לקרוא את הקובץ');
    return null;
  }
}

/** onPaste handler for a textarea: an image pasted with Ctrl+V becomes the attachment */
export function pasteHandler(onChange: (attachment: AiAttachment) => void) {
  return async (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.files).find((f) => AI_ATTACHMENT_TYPES.includes(f.type));
    if (!file) return; // plain text paste
    e.preventDefault();
    const attachment = await fileToAttachment(file);
    if (attachment) {
      onChange(attachment);
      toast.success('התמונה צורפה');
    }
  };
}

export function AiAttachmentPicker({
  attachment,
  onChange,
  disabled,
}: {
  attachment: AiAttachment | null;
  onChange: (attachment: AiAttachment | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const result = await fileToAttachment(file);
    if (result) onChange(result);
  };

  if (attachment) {
    const Icon = attachment.mimeType === 'application/pdf' ? FileText : ImageIcon;
    return (
      <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-brand-teal px-3 py-1.5 text-sm text-white">
        <Icon className="h-4 w-4 shrink-0 text-brand-cyan" />
        <span className="truncate">{attachment.name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="rounded-full p-0.5 hover:bg-white/10"
          aria-label="הסרת הקובץ המצורף"
        >
          <X className="h-4 w-4" />
        </button>
      </span>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={AI_ATTACHMENT_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = ''; // allow picking the same file again
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="border-brand-sage bg-transparent text-white hover:bg-white/10 hover:text-white"
      >
        <Paperclip className="h-4 w-4" />
        צירוף תמונה / PDF
      </Button>
    </>
  );
}
