'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFormBuilderStore } from '@/store/formBuilderStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fieldTypeLabel } from './FieldPalette';
import type { FormField } from '@/types/form';

function SortableField({ field, onDelete }: { field: FormField; onDelete: (field: FormField) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const { selectedFieldId, selectField } = useFormBuilderStore();
  const isSelected = selectedFieldId === field.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-3 border rounded-lg bg-white cursor-pointer hover:border-brand-500 transition-colors',
        isSelected && 'ring-2 ring-brand-500 bg-brand-50',
        isDragging && 'opacity-50'
      )}
      onClick={() => selectField(field.id)}
    >
      <button {...attributes} {...listeners} className="cursor-grab touch-none" title="גררי כדי לשנות סדר">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{field.label}</span>
          <Badge variant="secondary" className="text-xs">{fieldTypeLabel(field.type)}</Badge>
          {field.required && <Badge className="text-xs">חובה</Badge>}
        </div>
        {field.placeholder && (
          <p className="text-xs text-muted-foreground mt-1">{field.placeholder}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        title="מחיקת שדה"
        onClick={(e) => { e.stopPropagation(); onDelete(field); }}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function BuilderCanvas() {
  const { fields, reorderFields, removeField } = useFormBuilderStore();
  const [fieldToDelete, setFieldToDelete] = useState<FormField | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderFields(active.id as string, over.id as string);
    }
  };

  const confirmDelete = () => {
    if (fieldToDelete) removeField(fieldToDelete.id);
    setFieldToDelete(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">מבנה הטופס</CardTitle>
        <p className="text-xs text-muted-foreground">
          לחצי על שדה כדי לערוך אותו, או גררי אותו כדי לשנות את הסדר
        </p>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>אין שדות עדיין</p>
            <p className="text-sm mt-1">הוסיפי שדות מהפאנל &quot;הוסף שדה&quot;</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {fields.map((field) => (
                  <SortableField key={field.id} field={field} onDelete={setFieldToDelete} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <Dialog open={!!fieldToDelete} onOpenChange={(open) => !open && setFieldToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>למחוק את השדה?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            השדה &quot;{fieldToDelete?.label}&quot; יוסר מהטופס. השינוי ייכנס לתוקף רק אחרי לחיצה על &quot;שמור שינויים&quot;.
          </p>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={confirmDelete}>מחק</Button>
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
