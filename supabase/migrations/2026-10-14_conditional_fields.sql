-- Conditional fields: show a field only when another field has a given answer.
-- Example value: {"field_id": "<uuid of the controlling field>", "equals": "בחורה"}. NULL = always shown.
ALTER TABLE public.form_fields ADD COLUMN IF NOT EXISTS show_if JSONB;
