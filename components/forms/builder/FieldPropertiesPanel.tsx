'use client';

import { useFormBuilderStore } from '@/store/formBuilderStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { fieldTypeLabel } from './FieldPalette';

export function FieldPropertiesPanel() {
  const { fields, selectedFieldId, updateField } = useFormBuilderStore();
  const field = fields.find((f) => f.id === selectedFieldId);

  if (!field) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">עריכת שדה</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm space-y-2">
          <p>לא נבחר שדה.</p>
          <p>
            לחצי על שדה ב&quot;מבנה הטופס&quot; כדי לשנות את השם שלו, את הטקסט המנחה ואם הוא שדה חובה.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasOptions = ['radio', 'select', 'checkbox'].includes(field.type);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">עריכת שדה: {fieldTypeLabel(field.type)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>שם השדה (מה שהלקוח יראה)</Label>
          <Input
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>טקסט מנחה בתוך השדה (לא חובה)</Label>
          <Input
            value={field.placeholder ?? ''}
            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="required"
            checked={field.required}
            onCheckedChange={(checked) => updateField(field.id, { required: !!checked })}
          />
          <Label htmlFor="required">שדה חובה</Label>
        </div>
        {hasOptions && (
          <div className="space-y-2">
            <Label>אפשרויות (שורה לכל אפשרות)</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={(field.options ?? []).join('\n')}
              onChange={(e) =>
                updateField(field.id, {
                  options: e.target.value.split('\n').filter(Boolean),
                })
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
