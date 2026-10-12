'use client';

import { useEffect, useTransition } from 'react';
import { useFormBuilderStore } from '@/store/formBuilderStore';
import { FormBuilder } from '@/components/forms/builder/FormBuilder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { saveFormFields } from './actions';
import type { Form, FormField } from '@/types/form';
import { toast } from 'sonner';
import Link from 'next/link';
import { Copy, Eye } from 'lucide-react';

interface EditFormClientProps {
  form: Form;
  fields: FormField[];
}

export function EditFormClient({ form, fields }: EditFormClientProps) {
  const { loadForm, form: storeForm, fields: storeFields, isDirty, markClean } = useFormBuilderStore();
  const [isSaving, startSave] = useTransition();

  useEffect(() => {
    loadForm(form, fields);
  }, [form, fields, loadForm]);

  // Warn before leaving with unsaved changes: browser close/refresh, and in-app link clicks
  useEffect(() => {
    if (!isDirty) return;
    const message = 'יש שינויים שלא נשמרו. לצאת בלי לשמור?';

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const handleLinkClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link || link.target === '_blank') return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleLinkClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [isDirty]);

  const handleSave = () => {
    startSave(async () => {
      try {
        await saveFormFields(form.id, storeFields);
        markClean();
        toast.success('הטופס נשמר בהצלחה');
      } catch {
        toast.error('שגיאה בשמירה');
      }
    });
  };

  const copyLink = () => {
    // Built from the current address, so it is right both locally and on the deployed site
    navigator.clipboard.writeText(`${window.location.origin}/forms/${form.slug}`);
    toast.success('הקישור הועתק');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">{storeForm?.title ?? form.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={form.is_active ? 'default' : 'secondary'}>
              {form.is_active ? 'פעיל' : 'לא פעיל'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4 me-1" />
              העתק קישור
            </Button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild>
            <a
              href={`/forms/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="פותח את הטופס כפי שהלקוח רואה אותו (הגרסה השמורה)"
            >
              <Eye className="h-4 w-4 me-1" />
              תצוגה מקדימה
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/forms/${form.id}/submissions`}>הגשות</Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isDirty}>
            {isSaving ? 'שומר...' : 'שמור שינויים'}
          </Button>
        </div>
      </div>
      <FormBuilder />
    </div>
  );
}
