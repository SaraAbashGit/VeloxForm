'use client';

import { useState, useTransition } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { explainForm } from '@/app/forms/[id]/ai-actions';

// "על מה אני חותם?" — asks the AI for a plain-language summary of the form before the customer signs
export function ExplainFormButton({ slug }: { slug: string }) {
  const [points, setPoints] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();

  const load = () => {
    setError(null);
    startLoading(async () => {
      const result = await explainForm(slug);
      if (result.ok) setPoints(result.points);
      else setError(result.error);
    });
  };

  if (points) {
    return (
      <div className="rounded-lg border border-brand-cyan bg-brand-cyan-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-2 font-semibold text-brand-teal">
            <Sparkles className="h-4 w-4 text-brand-cyan-700" />
            על מה את/ה חותם/ת, בקצרה
          </p>
          <button type="button" onClick={() => setPoints(null)} aria-label="סגירה" className="text-brand-sage hover:text-brand-teal">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="list-disc space-y-1 ps-5 text-sm text-brand-teal">
          {points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">הסבר אוטומטי של AI. הנוסח הקובע הוא הטופס עצמו.</p>
      </div>
    );
  }

  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={load} disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isLoading ? 'ה-AI קורא את הטופס...' : 'על מה אני חותם/ת? הסבר ב-AI'}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
