'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { requestUploadUrl } from '@/app/forms/[id]/upload-action';

const MAX_SIZE = 10_000_000; // same limit as the storage bucket
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

const TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

interface FileUploadFieldProps {
  value?: string;
  onChange: (value: string) => void;
}

const getStoredFileName = (value?: string) => {
  if (!value) return null;
  try {
    return (JSON.parse(value) as { name?: string }).name ?? 'קובץ הועלה';
  } catch {
    return 'קובץ הועלה';
  }
};

export function FileUploadField({ value, onChange }: FileUploadFieldProps) {
  // Unique id per field: with a fixed id, every "choose file" button opened the first field's input
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileName = getStoredFileName(value);

  // Upload straight to private storage; the form answer only keeps the name and storage path
  const handleFile = useCallback(async (file: File) => {
    setError(null);
    // Some phones/browsers report an empty or non-standard type: fall back to the file extension
    const type = ALLOWED_TYPES.includes(file.type) ? file.type : TYPE_BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''];
    if (file.size > MAX_SIZE) {
      setError('הקובץ גדול מ-10MB');
      return;
    }
    if (!type) {
      setError('סוג קובץ לא נתמך. אפשר להעלות PDF, Word או תמונה (JPG/PNG)');
      return;
    }
    setIsUploading(true);
    try {
      let target: Awaited<ReturnType<typeof requestUploadUrl>>;
      try {
        target = await requestUploadUrl(file.name, type, file.size);
      } catch (err) {
        // Usually a page opened before the site was updated: its server actions no longer exist
        console.error('requestUploadUrl failed:', err);
        setError('אין חיבור לשרת. רעננו את הדף (F5) ונסו שוב');
        return;
      }
      if (!target.ok) {
        setError(target.error);
        return;
      }
      const { error: uploadError } = await createClient()
        .storage.from('uploads')
        .uploadToSignedUrl(target.path, target.token, file, { contentType: type });
      if (uploadError) {
        console.error('Storage upload failed:', uploadError);
        setError('שמירת הקובץ נכשלה. ייתכן שהרשת חוסמת העלאת קבצים. נסו שוב או מרשת אחרת');
        return;
      }
      onChange(JSON.stringify({ name: file.name, path: target.path }));
    } catch (err) {
      console.error('File upload failed:', err);
      setError('העלאת הקובץ נכשלה. בדקו את החיבור לאינטרנט ונסו שוב');
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const openPicker = () => inputRef.current?.click();

  const removeFile = () => {
    setError(null);
    onChange('');
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
        !fileName && !isUploading && 'cursor-pointer hover:border-brand-500',
        error && 'border-destructive'
      )}
      onClick={fileName || isUploading ? undefined : openPicker}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {isUploading ? (
        <>
          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-brand-teal" />
          <p className="text-sm text-muted-foreground">מעלה את הקובץ...</p>
        </>
      ) : fileName ? (
        <>
          <FileText className="h-8 w-8 mx-auto mb-2 text-brand-500" />
          <p className="text-sm font-medium break-all">{fileName}</p>
          <div className="flex justify-center gap-2 mt-3">
            <Button type="button" variant="outline" size="sm" onClick={openPicker}>
              החלף קובץ
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={removeFile}>
              הסר
            </Button>
          </div>
        </>
      ) : (
        <>
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">גררי קובץ לכאן או לחצי לבחירה</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, Word או תמונה (JPG/PNG), עד 10MB</p>
        </>
      )}
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        id={inputId}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ''; // allow choosing the same file again after removing it
        }}
      />
    </div>
  );
}
