'use client';

import type { Control, FieldValues } from 'react-hook-form';
import type { FormField } from '@/types/form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { SignatureCanvas } from '@/components/signature/SignatureCanvas';
import { FileUploadField } from './FileUploadField';
import { Controller } from 'react-hook-form';

interface FieldRendererProps {
  field: FormField;
  control: Control<FieldValues>;
}

export function FieldRenderer({ field, control }: FieldRendererProps) {
  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-destructive ms-1">*</span>}
      </Label>
      <Controller
        name={field.id}
        control={control}
        render={({ field: rhfField }) => {
          switch (field.type) {
            case 'textarea':
              return (
                <Textarea
                  placeholder={field.placeholder}
                  value={rhfField.value ?? ''}
                  onChange={rhfField.onChange}
                />
              );
            case 'number':
              return (
                <Input
                  type="number"
                  placeholder={field.placeholder}
                  value={rhfField.value ?? ''}
                  onChange={rhfField.onChange}
                  dir="ltr"
                />
              );
            case 'email':
              return (
                <Input
                  type="email"
                  placeholder={field.placeholder}
                  value={rhfField.value ?? ''}
                  onChange={rhfField.onChange}
                  dir="ltr"
                />
              );
            case 'phone':
              return (
                <Input
                  type="tel"
                  placeholder={field.placeholder}
                  value={rhfField.value ?? ''}
                  onChange={rhfField.onChange}
                  dir="ltr"
                />
              );
            case 'date':
              return (
                <Input
                  type="date"
                  value={rhfField.value ?? ''}
                  onChange={rhfField.onChange}
                  dir="ltr"
                />
              );
            case 'checkbox':
              return (
                <div className="space-y-2">
                  {(field.options ?? []).map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <Checkbox
                        checked={(rhfField.value as string[] ?? []).includes(opt)}
                        onCheckedChange={(checked) => {
                          const current = (rhfField.value as string[]) ?? [];
                          rhfField.onChange(
                            checked ? [...current, opt] : current.filter((v) => v !== opt)
                          );
                        }}
                      />
                      <span className="text-sm">{opt}</span>
                    </div>
                  ))}
                </div>
              );
            case 'radio':
              return (
                <div className="space-y-2">
                  {(field.options ?? []).map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={field.id}
                        value={opt}
                        checked={rhfField.value === opt}
                        onChange={() => rhfField.onChange(opt)}
                        className="accent-brand-500"
                      />
                      <span className="text-sm">{opt}</span>
                    </div>
                  ))}
                </div>
              );
            case 'select':
              return (
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={rhfField.value ?? ''}
                  onChange={rhfField.onChange}
                >
                  <option value="">בחר...</option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              );
            case 'signature':
              return (
                <SignatureCanvas
                  value={rhfField.value}
                  onChange={rhfField.onChange}
                />
              );
            case 'file_upload':
              return (
                <FileUploadField
                  value={rhfField.value}
                  onChange={rhfField.onChange}
                />
              );
            default:
              return (
                <Input
                  type="text"
                  placeholder={field.placeholder}
                  value={rhfField.value ?? ''}
                  onChange={rhfField.onChange}
                />
              );
          }
        }}
      />
    </div>
  );
}
