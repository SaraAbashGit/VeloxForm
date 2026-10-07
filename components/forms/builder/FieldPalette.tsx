'use client';

import { useFormBuilderStore } from '@/store/formBuilderStore';
import type { FieldType } from '@/types/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Type, AlignLeft, Hash, Mail, Phone, CheckSquare,
  Circle, List, Calendar, PenTool, Upload,
} from 'lucide-react';

export const fieldTypes: { type: FieldType; label: string; icon: React.ElementType }[] = [
  { type: 'text', label: 'טקסט', icon: Type },
  { type: 'textarea', label: 'טקסט ארוך', icon: AlignLeft },
  { type: 'number', label: 'מספר', icon: Hash },
  { type: 'email', label: 'אימייל', icon: Mail },
  { type: 'phone', label: 'טלפון', icon: Phone },
  { type: 'checkbox', label: 'תיבות סימון', icon: CheckSquare },
  { type: 'radio', label: 'בחירה יחידה', icon: Circle },
  { type: 'select', label: 'רשימה נפתחת', icon: List },
  { type: 'date', label: 'תאריך', icon: Calendar },
  { type: 'signature', label: 'חתימה', icon: PenTool },
  { type: 'file_upload', label: 'העלאת קובץ', icon: Upload },
];

export const fieldTypeLabel = (type: FieldType) =>
  fieldTypes.find((t) => t.type === type)?.label ?? type;

export function FieldPalette() {
  const addField = useFormBuilderStore((s) => s.addField);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">הוסף שדה</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {fieldTypes.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            className="justify-start gap-2 h-auto py-2"
            onClick={() => addField(type)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
