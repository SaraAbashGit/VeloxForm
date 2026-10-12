-- USERS (Extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FORMS
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FORM FIELDS
CREATE TABLE public.form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'text','textarea','number','email','phone',
    'checkbox','radio','select','date','signature','file_upload'
  )),
  label TEXT NOT NULL,
  placeholder TEXT,
  required BOOLEAN DEFAULT FALSE,
  options JSONB,
  default_value TEXT,
  field_order INTEGER NOT NULL
);

-- SUBMISSIONS
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_url TEXT,
  snapshot_json JSONB NOT NULL
);

-- SUBMISSION ANSWERS
CREATE TABLE public.submission_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.form_fields(id),
  answer_value TEXT
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "users_own_profile" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "owner_access" ON public.forms
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "public_read_active_forms" ON public.forms
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "owner_fields" ON public.form_fields
  FOR ALL USING (
    form_id IN (SELECT id FROM public.forms WHERE user_id = auth.uid())
  );

CREATE POLICY "public_read_form_fields" ON public.form_fields
  FOR SELECT USING (
    form_id IN (SELECT id FROM public.forms WHERE is_active = TRUE)
  );

CREATE POLICY "owner_read_submissions" ON public.submissions
  FOR SELECT USING (
    form_id IN (SELECT id FROM public.forms WHERE user_id = auth.uid())
  );

CREATE POLICY "public_insert_submissions" ON public.submissions
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "owner_read_answers" ON public.submission_answers
  FOR SELECT USING (
    submission_id IN (
      SELECT s.id FROM public.submissions s
      JOIN public.forms f ON f.id = s.form_id
      WHERE f.user_id = auth.uid()
    )
  );

CREATE POLICY "public_insert_answers" ON public.submission_answers
  FOR INSERT WITH CHECK (TRUE);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, business_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'העסק שלי'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage buckets (run in Supabase dashboard or via API)
-- signatures: public read, authenticated write
-- uploads: public read, anon insert
-- pdfs: public read, service role write

-- 2026-10-12: answers are read against submissions.snapshot_json, so they must not block editing or deleting form fields
ALTER TABLE public.submission_answers DROP CONSTRAINT IF EXISTS submission_answers_field_id_fkey;
