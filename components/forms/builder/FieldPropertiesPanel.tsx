'use client';

import { useFormBuilderStore } from '@/store/formBuilderStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { fieldTypeLabel } from './FieldPalette';
import { canControlConditions } from '@/lib/form-conditions';
import type { FormField } from '@/types/form';

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
        <ConditionEditor field={field} />
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

const selectClass = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm';

// "Show this field only if <other field> = <answer>". Only earlier fields with options can control it.
function ConditionEditor({ field }: { field: FormField }) {
  const { fields, updateField } = useFormBuilderStore();
  const index = fields.findIndex((f) => f.id === field.id);
  const controllers = fields.slice(0, index).filter(canControlConditions);
  const controller = controllers.find((f) => f.id === field.show_if?.field_id);

  if (controllers.length === 0 && !field.show_if) {
    return (
      <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
        הצגה מותנית: כדי להציג את השדה רק לפי תשובה מסוימת, צריך מעליו שדה עם אפשרויות (בחירה יחידה, רשימה או תיבות סימון).
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label>מתי להציג את השדה?</Label>
      <select
        className={selectClass}
        value={controller?.id ?? ''}
        onChange={(e) => {
          const next = controllers.find((f) => f.id === e.target.value);
          updateField(field.id, { show_if: next ? { field_id: next.id, equals: next.options![0] } : null });
        }}
      >
        <option value="">תמיד</option>
        {controllers.map((f) => (
          <option key={f.id} value={f.id}>
            רק לפי התשובה ל: {f.label}
          </option>
        ))}
      </select>
      {controller && (
        <>
          <Label>כשהתשובה היא:</Label>
          <select
            className={selectClass}
            value={field.show_if?.equals ?? ''}
            onChange={(e) => updateField(field.id, { show_if: { field_id: controller.id, equals: e.target.value } })}
          >
            {(controller.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
