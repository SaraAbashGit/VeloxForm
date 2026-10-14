import type { AIFormSchema, FormField } from '@/types/form';
import { cleanConditions } from '@/lib/form-conditions';

/**
 * Turns the AI's fields into form fields with real ids. The AI refers to fields by its own "key";
 * a key that matches an existing field id keeps that id, anything else becomes a new field.
 * Conditions (show_if) are translated from keys to field ids, and invalid ones are dropped.
 */
export function aiFieldsToFormFields(
  aiFields: AIFormSchema['fields'],
  formId: string,
  existingIds: Set<string> = new Set()
): FormField[] {
  const idByKey = new Map<string, string>();
  const usedIds = new Set<string>();

  const fields: FormField[] = aiFields.map((f, i) => {
    const keepId = f.key && existingIds.has(f.key) && !usedIds.has(f.key);
    const id = keepId ? f.key! : crypto.randomUUID();
    usedIds.add(id);
    if (f.key && !idByKey.has(f.key)) idByKey.set(f.key, id);
    return {
      id,
      form_id: formId,
      type: f.type,
      label: f.label,
      placeholder: f.placeholder,
      required: f.required,
      options: f.options,
      field_order: i,
      show_if: null,
    };
  });

  aiFields.forEach((f, i) => {
    const controllerId = f.show_if && idByKey.get(f.show_if.key);
    if (controllerId) fields[i].show_if = { field_id: controllerId, equals: f.show_if!.equals };
  });

  return cleanConditions(fields);
}
