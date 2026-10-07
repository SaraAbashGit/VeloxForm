# FormAI — תוכנית בניית המערכת

ראה את קובץ התוכנית המלא ב-`.cursor/plans/formai_saas_build_db88bd4a.plan.md`

## הפעלה מהירה

1. הרץ את `supabase/schema.sql` ב-Supabase SQL Editor
2. צור Storage buckets: `signatures`, `uploads`, `pdfs` (public read)
3. מלא את `.env.local` עם מפתחות Supabase, OpenAI, Resend
4. `npm install && npm run dev`

## מבנה הפרויקט

- `/app/(auth)` — התחברות והרשמה
- `/app/(dashboard)` — לוח בקרה, בילדר, הגשות
- `/app/forms/[slug]` — טופס ציבורי
- `/components` — UI, שדות, בילדר, חתימה, PDF
- `/lib` — Supabase, OpenAI, PDF, validations, email
- `/store` — Zustand formBuilderStore
