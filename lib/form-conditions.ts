import type { FormField } from '@/types/form';

/** Fields whose answers can drive a condition: they have a fixed list of options */
export function canControlConditions(field: FormField): boolean {
  return ['radio', 'select', 'checkbox'].includes(field.type) && (field.options?.length ?? 0) > 0;
}

function matches(value: unknown, expected: string): boolean {
  if (Array.isArray(value)) return value.map(String).includes(expected);
  return value !== undefined && value !== null && String(value) === expected;
}

/**
 * The fields the customer should see for the current answers. A field with show_if is visible only when
 * its controlling field is visible and has the expected answer, so hiding a field also hides its dependents.
 * Used both in the browser (live form) and on the server (validation, saved answers, PDF).
 */
export function visibleFields(fields: FormField[], values: Record<string, unknown>): FormField[] {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const cache = new Map<string, boolean>();

  const isVisible = (field: FormField, depth = 0): boolean => {
    const cached = cache.get(field.id);
    if (cached !== undefined) return cached;
    let visible = true;
    if (field.show_if) {
      const controller = byId.get(field.show_if.field_id);
      // A condition on a missing field, or a loop, never hides anything
      visible =
        !controller || depth > fields.length
          ? true
          : isVisible(controller, depth + 1) && matches(values[controller.id], field.show_if.equals);
    }
    cache.set(field.id, visible);
    return visible;
  };

  return fields.filter((f) => isVisible(f));
}

/** Drops conditions that point at a field that no longer exists or can't drive conditions */
export function cleanConditions(fields: FormField[]): FormField[] {
  const controllers = new Map(fields.filter(canControlConditions).map((f) => [f.id, f]));
  return fields.map((f) => {
    if (!f.show_if) return f;
    const controller = controllers.get(f.show_if.field_id);
    const valid = controller && controller.id !== f.id && controller.options!.includes(f.show_if.equals);
    return valid ? f : { ...f, show_if: null };
  });
}
