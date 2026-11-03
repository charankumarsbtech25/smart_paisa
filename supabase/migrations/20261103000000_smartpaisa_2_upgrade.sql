-- SmartPaisa 2.0 Database Upgrade Migration
-- Introduces comprehensive FinTech modules: Income Tracking, Savings Goals,
-- Category Predictions (Active Learning), Expense Forecasts, Anomaly Alerts,
-- Financial Health Scores, Statement Staging, and Notifications.

-- 1. INCOMES TABLE
CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recurrence TEXT CHECK (recurrence IN ('one_time', 'monthly', 'weekly', 'freelance')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. SAVINGS GOALS TABLE
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE NOT NULL,
  category TEXT DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. SAVINGS CONTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. CATEGORY PREDICTIONS & CORRECTIONS (Active Learning Loop)
CREATE TABLE IF NOT EXISTS public.category_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_description TEXT NOT NULL,
  predicted_category TEXT NOT NULL,
  confirmed_category TEXT,
  confidence_score NUMERIC(5, 4) NOT NULL,
  is_corrected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. EXPENSE FORECASTS TABLE
CREATE TABLE IF NOT EXISTS public.expense_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forecast_horizon TEXT NOT NULL CHECK (forecast_horizon IN ('7_days', '30_days', 'month_end')),
  predicted_amount NUMERIC(12, 2) NOT NULL,
  lower_bound NUMERIC(12, 2) NOT NULL,
  upper_bound NUMERIC(12, 2) NOT NULL,
  model_name TEXT NOT NULL,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ANOMALY ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('high_amount', 'unusual_category', 'sudden_spike', 'duplicate')),
  anomaly_score NUMERIC(5, 4) NOT NULL,
  explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (status IN ('unreviewed', 'confirmed_valid', 'flagged', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. FINANCIAL HEALTH SCORES TABLE
CREATE TABLE IF NOT EXISTS public.financial_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  budget_adherence_score INTEGER NOT NULL,
  savings_consistency_score INTEGER NOT NULL,
  expense_velocity_score INTEGER NOT NULL,
  emergency_fund_score INTEGER NOT NULL,
  goal_progress_score INTEGER NOT NULL,
  insights JSONB DEFAULT '[]'::jsonb,
  calculated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. UPLOADED STATEMENTS & IMPORTED TRANSACTIONS (Staging & OCR)
CREATE TABLE IF NOT EXISTS public.uploaded_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'csv', 'image')),
  file_size_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  extracted_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.imported_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID REFERENCES public.uploaded_statements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  expense_date DATE NOT NULL,
  suggested_category TEXT,
  confidence NUMERIC(5, 4),
  is_duplicate BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'staged' CHECK (status IN ('staged', 'confirmed', 'ignored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. NOTIFICATIONS & PREFERENCES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('budget_alert', 'anomaly', 'goal_milestone', 'prediction_warning', 'system')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_alerts_enabled BOOLEAN DEFAULT true,
  anomaly_alerts_enabled BOOLEAN DEFAULT true,
  goal_alerts_enabled BOOLEAN DEFAULT true,
  forecast_alerts_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. MODEL METADATA & TELEMETRY
CREATE TABLE IF NOT EXISTS public.model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES FOR SPEED AND QUERY OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON public.incomes(user_id, income_date DESC);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_savings_contrib_goal ON public.savings_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_user ON public.expense_forecasts(user_id, forecast_horizon);
CREATE INDEX IF NOT EXISTS idx_anomalies_user ON public.anomaly_alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fin_scores_user ON public.financial_scores(user_id, calculated_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_imported_trans_user ON public.imported_transactions(user_id, status);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- POLICIES: Incomes
CREATE POLICY "Users can view own incomes" ON public.incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own incomes" ON public.incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incomes" ON public.incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own incomes" ON public.incomes FOR DELETE USING (auth.uid() = user_id);

-- POLICIES: Savings Goals
CREATE POLICY "Users can view own savings goals" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings goals" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings goals" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings goals" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);

-- POLICIES: Savings Contributions
CREATE POLICY "Users can view own contributions" ON public.savings_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contributions" ON public.savings_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own contributions" ON public.savings_contributions FOR DELETE USING (auth.uid() = user_id);

-- POLICIES: Category Predictions
CREATE POLICY "Users can view own category predictions" ON public.category_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own category predictions" ON public.category_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICIES: Forecasts
CREATE POLICY "Users can view own forecasts" ON public.expense_forecasts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own forecasts" ON public.expense_forecasts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICIES: Anomaly Alerts
CREATE POLICY "Users can view own anomalies" ON public.anomaly_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own anomalies" ON public.anomaly_alerts FOR UPDATE USING (auth.uid() = user_id);

-- POLICIES: Financial Scores
CREATE POLICY "Users can view own financial scores" ON public.financial_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own financial scores" ON public.financial_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICIES: Uploaded Statements
CREATE POLICY "Users can view own uploaded statements" ON public.uploaded_statements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own uploaded statements" ON public.uploaded_statements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own uploaded statements" ON public.uploaded_statements FOR DELETE USING (auth.uid() = user_id);

-- POLICIES: Imported Transactions
CREATE POLICY "Users can view own imported transactions" ON public.imported_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own imported transactions" ON public.imported_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own imported transactions" ON public.imported_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own imported transactions" ON public.imported_transactions FOR DELETE USING (auth.uid() = user_id);

-- POLICIES: Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- POLICIES: Notification Preferences
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
