import { create } from 'zustand';
import type { Form, FormField, FieldType } from '@/types/form';

interface FormBuilderState {
  form: Form | null;
  fields: FormField[];
  selectedFieldId: string | null;
  isDirty: boolean;
  setForm: (form: Form) => void;
  setFields: (fields: FormField[]) => void;
  addField: (type: FieldType) => void;
  removeField: (id: string) => void;
  reorderFields: (activeId: string, overId: string) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;
  selectField: (id: string | null) => void;
  loadForm: (form: Form, fields: FormField[]) => void;
  reset: () => void;
  markClean: () => void;
}

export const useFormBuilderStore = create<FormBuilderState>((set, get) => ({
  form: null,
  fields: [],
  selectedFieldId: null,
  isDirty: false,

  setForm: (form) => set({ form }),

  setFields: (fields) => set({ fields, isDirty: true }),

  addField: (type) => {
    const form = get().form;
    if (!form) return;
    const fields = get().fields;
    const newField: FormField = {
      id: crypto.randomUUID(), // form_fields.id is a UUID column in the DB
      form_id: form.id,
      type,
      label: `שדה חדש`,
      required: false,
      field_order: fields.length,
      options: ['radio', 'select', 'checkbox'].includes(type) ? ['אפשרות 1', 'אפשרות 2'] : undefined,
    };
    set({ fields: [...fields, newField], selectedFieldId: newField.id, isDirty: true });
  },

  removeField: (id) => {
    const fields = get().fields
      .filter((f) => f.id !== id)
      .map((f, i) => ({ ...f, field_order: i }));
    set({
      fields,
      selectedFieldId: get().selectedFieldId === id ? null : get().selectedFieldId,
      isDirty: true,
    });
  },

  reorderFields: (activeId, overId) => {
    const fields = [...get().fields];
    const oldIndex = fields.findIndex((f) => f.id === activeId);
    const newIndex = fields.findIndex((f) => f.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const [removed] = fields.splice(oldIndex, 1);
    fields.splice(newIndex, 0, removed);
    set({
      fields: fields.map((f, i) => ({ ...f, field_order: i })),
      isDirty: true,
    });
  },

  updateField: (id, updates) => {
    set({
      fields: get().fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      isDirty: true,
    });
  },

  selectField: (id) => set({ selectedFieldId: id }),

  loadForm: (form, fields) =>
    set({ form, fields: fields.sort((a, b) => a.field_order - b.field_order), isDirty: false, selectedFieldId: null }),

  reset: () => set({ form: null, fields: [], selectedFieldId: null, isDirty: false }),

  markClean: () => set({ isDirty: false }),
}));
