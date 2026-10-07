'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { generateFormFromPrompt } from './actions';
import { saveGeneratedForm } from './save-action';
import type { AIFormSchema } from '@/types/form';
import { toast } from 'sonner';

export default function NewFormPage() {
  const [prompt, setPrompt] = useState('');
  const [preview, setPreview] = useState<AIFormSchema | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [isSaving, startSave] = useTransition();

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('יש להזין תיאור לטופס');
      return;
    }
    startGenerate(async () => {
      try {
        const result = await generateFormFromPrompt(prompt);
        if (result.ok) {
          setPreview(result.form);
          toast.success('הטופס נוצר בהצלחה!');
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error('שגיאה ביצירת הטופס');
      }
    });
  };

  const handleSave = () => {
    if (!preview) return;
    startSave(async () => {
      try {
        await saveGeneratedForm(preview);
      } catch {
        toast.error('שגיאה בשמירת הטופס');
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">יצירת טופס עם AI</h1>
        <p className="text-muted-foreground">תאר את הטופס שאתה צריך בשפה חופשית</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>תיאור הטופס</CardTitle>
          <CardDescription>לדוגמה: &quot;טופס הרשמה לחוג שחייה לילדים עם פרטי הורה, גיל, וחתימה&quot;</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">תאר את הטופס</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="תאר את הטופס שאתה רוצה ליצור..."
            />
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'יוצר טופס...' : 'צור טופס עם AI'}
          </Button>
        </CardContent>
      </Card>

      {isGenerating && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      {preview && !isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle>{preview.form_title}</CardTitle>
            <CardDescription>{preview.form_description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.fields.map((field, i) => (
              <div key={i} className="flex items-center gap-2 p-3 border rounded-lg">
                <Badge variant="secondary">{field.type}</Badge>
                <span className="font-medium">{field.label}</span>
                {field.required && <Badge>חובה</Badge>}
              </div>
            ))}
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? 'שומר...' : 'שמור וערוך טופס'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
