'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { generateFormFromPrompt } from './actions';
import { saveGeneratedForm } from './save-action';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';

// One-click prompts matching the target audiences in the spec
const EXAMPLES = [
  'טופס הרשמה לחדר כושר עם הצהרת בריאות וחתימה',
  'הסכם טיפול למטפל/ת עם פרטים אישיים וחתימה',
  'טופס הרשמה לשיעור פרטי עם פרטי הורה ותלמיד',
  'חוזה שירות ללקוח עסקי עם תנאי תשלום וחתימה',
];

export default function NewFormPage() {
  const [prompt, setPrompt] = useState('');
  const [isWorking, startWork] = useTransition();
  const [step, setStep] = useState<'generating' | 'saving'>('generating');

  // Generate, save and jump straight to the editor - no separate "save" step
  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error('יש להזין תיאור לטופס');
      return;
    }
    startWork(async () => {
      try {
        setStep('generating');
        const result = await generateFormFromPrompt(prompt);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setStep('saving');
        toast.success('הטופס נוצר! פותח אותו לעריכה...');
        await saveGeneratedForm(result.form);
      } catch {
        toast.error('שגיאה ביצירת הטופס');
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader withLogo title="יצירת טופס עם AI" subtitle="תאר/י את הטופס שצריך בשפה חופשית, וה-AI יבנה אותו" />

      <Card className="border-0 bg-brand-ink text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-cyan" />
            תיאור הטופס
          </CardTitle>
          <CardDescription className="text-brand-sage">אפשר לכתוב חופשי או לבחור אחת מהדוגמאות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt" className="sr-only">תאר את הטופס</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="לדוגמה: טופס הרשמה לחוג שחייה לילדים עם פרטי הורה, גיל וחתימה..."
              className="border-0 bg-brand-teal text-base text-white placeholder:text-brand-sage focus-visible:ring-brand-cyan focus-visible:ring-offset-brand-ink"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="rounded-full border border-brand-sage px-3 py-1.5 text-sm text-white/90 transition-colors hover:border-brand-cyan hover:text-brand-cyan"
              >
                {example}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={handleGenerate} disabled={isWorking} size="lg">
              <Sparkles className={isWorking ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              {!isWorking ? 'צור טופס עם AI' : step === 'generating' ? 'ה-AI בונה את הטופס...' : 'שומר ופותח לעריכה...'}
            </Button>
            {isWorking && <p className="text-sm text-brand-sage">זה יכול לקחת עד דקה, לא לסגור את העמוד</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
