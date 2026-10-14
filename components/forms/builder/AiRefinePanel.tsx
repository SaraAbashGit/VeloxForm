'use client';

import { useState, useTransition } from 'react';
import { Sparkles, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFormBuilderStore } from '@/store/formBuilderStore';
import { refineFormWithAi } from '@/app/(dashboard)/forms/[id]/edit/ai-actions';
import type { Form, FormField } from '@/types/form';

const EXAMPLES = [
  'הוסף שדה טלפון ומייל',
  'הפוך את כל השדות לחובה',
  'הוסף חתימה בסוף הטופס',
  'קצר את הטופס לשדות החשובים בלבד',
];

// Ask the AI to change the form, as when it was created. The result is loaded into the editor
// (not saved), so the owner reviews it and saves, or undoes it.
export function AiRefinePanel({ formId }: { formId: string }) {
  const { form, fields, setForm, setFields } = useFormBuilderStore();
  const [instruction, setInstruction] = useState('');
  const [previous, setPrevious] = useState<{ form: Form; fields: FormField[] } | null>(null);
  const [isWorking, startWork] = useTransition();

  const handleRefine = () => {
    if (!form) return;
    if (!instruction.trim()) {
      toast.error('כתבי מה לשנות בטופס');
      return;
    }
    startWork(async () => {
      const result = await refineFormWithAi(formId, instruction, {
        title: form.title,
        description: form.description,
        fields,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPrevious({ form, fields });
      setForm({ ...form, title: result.title, description: result.description });
      setFields(result.fields);
      setInstruction('');
      toast.success('הטופס עודכן! בדקי את השינויים ולחצי "שמור שינויים"');
    });
  };

  const handleUndo = () => {
    if (!previous) return;
    setForm(previous.form);
    setFields(previous.fields);
    setPrevious(null);
    toast.success('השינוי של ה-AI בוטל');
  };

  return (
    <Card className="border-0 bg-brand-ink text-white">
      <CardContent className="space-y-3 pt-6">
        <p className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-brand-cyan" />
          שינוי הטופס עם AI
        </p>
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={2}
          placeholder="לדוגמה: הוסף שדה תאריך לידה, ושנה את הכותרת ל'הרשמה לחוג'..."
          className="border-0 bg-brand-teal text-white placeholder:text-brand-sage focus-visible:ring-brand-cyan focus-visible:ring-offset-brand-ink"
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setInstruction(example)}
              className="rounded-full border border-brand-sage px-3 py-1 text-xs text-white/90 transition-colors hover:border-brand-cyan hover:text-brand-cyan"
            >
              {example}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleRefine} disabled={isWorking || !form}>
            <Sparkles className={isWorking ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {isWorking ? 'ה-AI מעדכן את הטופס...' : 'עדכן עם AI'}
          </Button>
          {previous && !isWorking && (
            <Button variant="outline" onClick={handleUndo} className="border-brand-sage text-white hover:bg-white/10">
              <Undo2 className="h-4 w-4" />
              ביטול השינוי האחרון
            </Button>
          )}
          {isWorking && <p className="text-sm text-brand-sage">זה יכול לקחת עד דקה</p>}
        </div>
      </CardContent>
    </Card>
  );
}
