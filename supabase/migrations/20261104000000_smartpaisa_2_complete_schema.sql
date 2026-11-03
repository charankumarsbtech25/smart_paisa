-- SmartPaisa 2.0 Complete Schema & Security Migration
-- Adds missing tables (categories, user_feedback, category_budgets),
-- enhances savings_contributions (planned vs verified actual deposits),
-- expands supported expense categories, configures private Supabase Storage RLS,
-- and ensures complete SELECT/INSERT/UPDATE/DELETE Row Level Security isolation.

-- 1. EXPAND EXPENSE CATEGORIES CHECK CONSTRAINT ON public.expenses
-- Preserves existing categories while adding Groceries, Rent, Subscriptions, Travel, Healthcare, Bills
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check CHECK (
  category IN (
    'Food & Dining',
    'Groceries',
    'Transport',
    'Travel',
    'Shopping',
    'Education',
    'Entertainment',
    'Bills & Recharge',
    'Rent',
    'Subscriptions',
    'Health',
    'Personal Care',
    'Other'
  )
);

-- Add optional subcategory & user_confirmed flags to expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category_confirmed BOOLEAN DEFAULT true;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- 2. CATEGORIES TABLE (System + User Custom Categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system default categories
  name TEXT NOT NULL,
  parent_category TEXT,
  icon TEXT DEFAULT 'Receipt',
  color TEXT DEFAULT '#10b981',
  is_system BOOLEAN DEFAULT false,
  recommended_share_pct NUMERIC(5, 2) DEFAULT 10.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_category_name UNIQUE NULLS NOT DISTINCT (user_id, name)
);

-- 3. CATEGORY BUDGETS & RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.category_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  allocated_amount NUMERIC(12, 2) NOT NULL CHECK (allocated_amount >= 0),
  recommended_amount NUMERIC(12, 2),
  recommendation_status TEXT DEFAULT 'pending' CHECK (recommendation_status IN ('pending', 'accepted', 'rejected', 'customized')),
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_cat_month_year UNIQUE (user_id, category, month, year)
);

-- 4. ENHANCE SAVINGS CONTRIBUTIONS (Separate Planned vs Verified Actual Deposits)
ALTER TABLE public.savings_contributions
  ADD COLUMN IF NOT EXISTS contribution_type TEXT NOT NULL DEFAULT 'verified_deposit'
  CHECK (contribution_type IN ('planned', 'verified_deposit'));

ALTER TABLE public.savings_contributions
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT true;

-- 5. USER FEEDBACK TABLE (Active Learning & Recommendation Feedback)
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'category_correction',
    'budget_recommendation',
    'anomaly_verification',
    'forecast_accuracy',
    'assistant_rating'
  )),
  target_id TEXT,
  input_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  original_prediction TEXT,
  user_correction TEXT,
  confidence_at_prediction NUMERIC(5, 4),
  accepted BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ENHANCE UPLOADED STATEMENTS FOR RETENTION / DELETION GOVERNANCE
ALTER TABLE public.uploaded_statements
  ADD COLUMN IF NOT EXISTS retention_days INTEGER DEFAULT 30 CHECK (retention_days >= 1 AND retention_days <= 365),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '30 days');

-- 7. INDEXES FOR NEW TABLES
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id, is_system);
CREATE INDEX IF NOT EXISTS idx_cat_budgets_user_period ON public.category_budgets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_type ON public.user_feedback(user_id, feedback_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_category_predictions_user ON public.category_predictions(user_id, is_corrected);

-- 8. UPDATED_AT TRIGGERS FOR NEW TABLES
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_category_budgets_updated_at ON public.category_budgets;
CREATE TRIGGER set_category_budgets_updated_at
  BEFORE UPDATE ON public.category_budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_user_feedback_updated_at ON public.user_feedback;
CREATE TRIGGER set_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. ENABLE ROW LEVEL SECURITY ON ALL NEW TABLES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_versions ENABLE ROW LEVEL SECURITY;

-- 10. COMPLETE RLS POLICIES (SELECT, INSERT, UPDATE, DELETE)

-- Categories: Users can read system categories OR their own custom categories; mutate only their own
CREATE POLICY "Users can view system and own categories"
  ON public.categories FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Category Budgets: Full CRUD isolation per user
CREATE POLICY "Users can view own category budgets"
  ON public.category_budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own category budgets"
  ON public.category_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own category budgets"
  ON public.category_budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own category budgets"
  ON public.category_budgets FOR DELETE
  USING (auth.uid() = user_id);

-- User Feedback: Full CRUD isolation per user
CREATE POLICY "Users can view own feedback"
  ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON public.user_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
  ON public.user_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- Fill missing CRUD policies on existing SmartPaisa 2.0 tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'category_predictions' AND policyname = 'Users can update own category predictions'
  ) THEN
    CREATE POLICY "Users can update own category predictions"
      ON public.category_predictions FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'category_predictions' AND policyname = 'Users can delete own category predictions'
  ) THEN
    CREATE POLICY "Users can delete own category predictions"
      ON public.category_predictions FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'anomaly_alerts' AND policyname = 'Users can insert own anomalies'
  ) THEN
    CREATE POLICY "Users can insert own anomalies"
      ON public.anomaly_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'anomaly_alerts' AND policyname = 'Users can delete own anomalies'
  ) THEN
    CREATE POLICY "Users can delete own anomalies"
      ON public.anomaly_alerts FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can insert own notifications'
  ) THEN
    CREATE POLICY "Users can insert own notifications"
      ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'model_versions' AND policyname = 'Authenticated users can view active models'
  ) THEN
    CREATE POLICY "Authenticated users can view active models"
      ON public.model_versions FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- 11. PRIVATE SUPABASE STORAGE BUCKET FOR STATEMENTS & RECEIPTS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'financial-statements',
  'financial-statements',
  false,
  5242880, -- 5 MB strict cap
  ARRAY['application/pdf', 'text/csv', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'text/csv', 'image/png', 'image/jpeg', 'image/webp', 'text/plain'];

-- Storage RLS Policies: Users can only access files inside their own folder (user_id/*)
DROP POLICY IF EXISTS "Users can upload own financial statements" ON storage.objects;
CREATE POLICY "Users can upload own financial statements"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'financial-statements'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can view own financial statements" ON storage.objects;
CREATE POLICY "Users can view own financial statements"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'financial-statements'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own financial statements" ON storage.objects;
CREATE POLICY "Users can delete own financial statements"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'financial-statements'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 12. SEED DEFAULT SYSTEM CATEGORIES
INSERT INTO public.categories (user_id, name, parent_category, icon, color, is_system, recommended_share_pct)
VALUES
  (NULL, 'Food & Dining', 'Needs & Wants', 'Utensils', '#10b981', true, 25.00),
  (NULL, 'Groceries', 'Needs', 'ShoppingBasket', '#059669', true, 12.00),
  (NULL, 'Transport', 'Needs', 'Train', '#3b82f6', true, 10.00),
  (NULL, 'Rent', 'Needs', 'Home', '#6366f1', true, 20.00),
  (NULL, 'Education', 'Needs', 'BookOpen', '#8b5cf6', true, 10.00),
  (NULL, 'Bills & Recharge', 'Needs', 'Zap', '#f59e0b', true, 6.00),
  (NULL, 'Shopping', 'Wants', 'ShoppingBag', '#ec4899', true, 8.00),
  (NULL, 'Entertainment', 'Wants', 'Film', '#f43f5e', true, 5.00),
  (NULL, 'Subscriptions', 'Wants', 'Repeat', '#14b8a6', true, 3.00),
  (NULL, 'Health', 'Needs', 'HeartPulse', '#ef4444', true, 5.00),
  (NULL, 'Personal Care', 'Wants', 'Sparkles', '#a855f7', true, 4.00),
  (NULL, 'Other', 'Misc', 'MoreHorizontal', '#64748b', true, 2.00)
ON CONFLICT DO NOTHING;

-- ROLLBACK INSTRUCTIONS (For Safe Down-Migration if required):
-- DROP TABLE IF EXISTS public.user_feedback CASCADE;
-- DROP TABLE IF EXISTS public.category_budgets CASCADE;
-- DROP TABLE IF EXISTS public.categories CASCADE;
