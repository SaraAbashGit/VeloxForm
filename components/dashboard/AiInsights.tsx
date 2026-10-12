'use client';

import { useState, useTransition } from 'react';
import { Lightbulb, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeSubmissions, type Insights } from '@/app/(dashboard)/forms/[id]/submissions/ai-actions';

// "ניתוח AI": themes, trends and recommendations across all submissions of one form
export function AiInsights({ formId, submissionCount }: { formId: string; submissionCount: number }) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [analyzed, setAnalyzed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();

  const analyze = () => {
    setError(null);
    startLoading(async () => {
      const result = await analyzeSubmissions(formId);
      if (result.ok) {
        setInsights(result.insights);
        setAnalyzed(result.analyzed);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl bg-brand-ink text-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold font-display">
            <Sparkles className="h-5 w-5 text-brand-cyan" />
            תובנות AI
          </h2>
          <p className="mt-1 text-sm text-brand-sage">
            ה-AI קורא את כל ההגשות ומזהה נושאים חוזרים, מגמות והמלצות. פרטים מזהים לא נשלחים לניתוח.
          </p>
        </div>
        <Button onClick={analyze} disabled={isLoading || submissionCount < 2}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isLoading ? 'מנתח את ההגשות...' : insights ? 'נתח שוב' : 'נתח את ההגשות'}
        </Button>
      </div>

      {submissionCount < 2 && !insights && (
        <p className="px-6 pb-6 text-sm text-brand-sage">צריך לפחות 2 הגשות כדי לזהות מגמות.</p>
      )}
      {error && <p className="px-6 pb-6 text-sm text-red-300">{error}</p>}

      {insights && (
        <div className="space-y-5 bg-brand-teal p-6">
          <p className="text-lg font-semibold text-brand-cyan">{insights.headline}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {insights.insights.map((item, i) => (
              <div key={i} className="rounded-lg bg-brand-ink/40 p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <TrendingUp className="h-4 w-4 shrink-0 text-brand-cyan" />
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-white/80">{item.detail}</p>
              </div>
            ))}
          </div>

          {insights.recommendations.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-2 font-semibold">
                <Lightbulb className="h-4 w-4 text-brand-cyan" />
                המלצות
              </p>
              <ul className="list-disc space-y-1 ps-5 text-sm text-white/90">
                {insights.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-brand-sage">נותחו {analyzed} הגשות אחרונות · ניתוח אוטומטי, כדאי לבדוק לפני החלטות</p>
        </div>
      )}
    </div>
  );
}
