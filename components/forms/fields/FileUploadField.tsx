'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

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
  const fileName = getStoredFileName(value);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (file.size > MAX_SIZE) {
      setError('הקובץ גדול מ-10MB');
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('סוג קובץ לא נתמך. אפשר להעלות PDF, Word או תמונה (JPG/PNG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onChange(JSON.stringify({ name: file.name, data: result, type: file.type }));
    };
    reader.readAsDataURL(file);
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
        !fileName && 'cursor-pointer hover:border-brand-500',
        error && 'border-destructive'
      )}
      onClick={fileName ? undefined : openPicker}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {fileName ? (
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
