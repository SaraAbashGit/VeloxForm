-- Customer accounts ("המסמכים שלי"). Safe to run more than once.

-- 1) Answers are read against submissions.snapshot_json, so they must not block editing/deleting form fields
ALTER TABLE public.submission_answers DROP CONSTRAINT IF EXISTS submission_answers_field_id_fkey;

-- 2) Link a submission to the signed-in customer who sent it (NULL for anonymous submissions)
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS submissions_client_id_idx ON public.submissions(client_id);

DROP POLICY IF EXISTS "client_read_own_submissions" ON public.submissions;
CREATE POLICY "client_read_own_submissions" ON public.submissions
  FOR SELECT USING (client_id = auth.uid());

-- 3) Customers are not businesses: don't create a business profile row for them
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'client' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (id, business_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'העסק שלי'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
