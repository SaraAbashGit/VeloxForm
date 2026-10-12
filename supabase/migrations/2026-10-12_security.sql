-- Security fix: submissions and answers are written only by the server (service role), after validation.
-- These policies let anyone with the public anon key insert rows directly, even into other businesses' forms.
DROP POLICY IF EXISTS "public_insert_submissions" ON public.submissions;
DROP POLICY IF EXISTS "public_insert_answers" ON public.submission_answers;
