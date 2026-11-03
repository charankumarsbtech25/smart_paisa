# SmartPaisa 2.0 — AI-Powered Personal Finance Management Platform

<p align="center">
  <img src="public/logo.svg" alt="SmartPaisa Logo" width="80" height="80" />
</p>

<p align="center">
  <strong>Production-grade, AI/ML-powered personal finance management platform built for Indian college students and young professionals.</strong>
</p>

---

## 🌟 SmartPaisa 2.0 Architecture & Core Modules

### 1. Advanced Financial Dashboard (`/dashboard`)
- **15+ Live Financial KPIs**: Total Monthly Expenses, Monthly Budget, Remaining Balance, Daily Average Spending, Safe Daily Allowance, Savings Rate, Budget Utilization %, Predicted End-of-Month Expenditure, Financial Health Score (0–100), Top Spending Categories, Recent Transactions, Savings Goal Progress, Unusual Spending Notifications, and Personalized AI Monthly Financial Summary.
- **6 Interactive Charts (with WCAG Tabular View Toggle)**:
  1. Category-wise Doughnut Chart
  2. 6-Month Expense vs Budget Comparison Bar Chart
  3. Daily Spending Velocity Line Chart
  4. Budget vs Actual Spending by Category
  5. Forecast vs Actual Cumulative Trajectory (with 95% CI bounds)
  6. Savings Growth Trajectory
- **Transparent Data Provenance**: Clearly labels whether the user is viewing an **Authenticated User Ledger** or **Interactive Demo Mode**.

### 2. Multi-Layer AI Expense Categorization
- Supports **12 Categories**: `Food & Dining`, `Groceries`, `Transport`, `Rent`, `Education`, `Shopping`, `Entertainment`, `Bills & Recharge`, `Subscriptions`, `Health`, `Personal Care`, and `Other`.
- **3-Tier Inference Pipeline**:
  1. **Active Learning User Feedback Layer**: Prioritizes user-confirmed corrections (`0.99` confidence).
  2. **Deterministic Indian Merchant & UPI Rule Engine**: Recognizes 100+ Indian merchants (Swiggy, Zomato, Blinkit, Zepto, Uber, DMRC, IRCTC, Jio, Airtel, Apollo, etc.) with subcategory classification.
  3. **TF-IDF + Logistic Regression Classifier**: Calibrated probability scoring for unseen descriptions.
- **Configurable Confidence Threshold**: Adjustable slider (`50%–95%`) with explicit confirmation prompts for low-confidence predictions. Never overwrites a category confirmed by the user.

### 3. Multi-Model AI Expense Forecasting (`/predictions`)
- Evaluates **4 Chronological Time-Series Models** without future-data leakage:
  1. **Moving Average (Baseline)**
  2. **Linear Regression (OLS)**
  3. **Random Forest Regressor**
  4. **XGBoost Gradient Boosting**
- Predicts **Next 7 Days**, **End-of-Month**, **Next Month (30-Day Horizon)**, and **Category-Wise Expenditure** with **95% confidence intervals** and walk-forward **MAE, RMSE, and MAPE** accuracy metrics.
- Never fabricates ML results—displays a clear insufficient-data notice when fewer than 3 historical transactions exist.

### 4. Smart Budget Recommendation Engine (`/budgets`)
- Analyzes historical spending patterns, identifies overspending categories, recommends monthly category limits, calculates daily spending allowances, and explains the reasoning behind every recommendation.
- Users can **Accept**, **Reject**, or **Customize** each category recommendation. Never modifies a user's budget without explicit permission.

### 5. Unusual Spending & Anomaly Detection (`/insights`)
- Combines **Isolation Forest**, **Local Outlier Factor (k-NN density)**, **Rolling Z-Score**, duplicate detection (within 48 hours), and **custom user thresholds**.
- Provides clear, human-readable explanations (e.g., *"Your shopping expenditure is significantly higher than your usual spending this month"*) and never labels a transaction as fraudulent without verification.

### 6. Complete Savings Goals Management (`/savings`)
- Create, edit, pause/resume, and delete savings goals with target amounts and target dates.
- **Strict Separation of Contributions**: Tracks **Verified Actual Deposits** separately from **Planned Contributions**, with one-click verification when planned funds are deposited.
- Evaluates target achievability based on required monthly savings vs net savings capacity.

### 7. Explainable Financial Health Score (`/insights`)
- Transparent 0–100 score using configurable product weights:
  - **Budget Adherence**: 30%
  - **Savings Consistency**: 25% (evaluated on relative percentage so low student income is never penalized)
  - **Expense Consistency / Velocity**: 20%
  - **Emergency Savings Progress**: 15%
  - **Savings Goal Progress**: 10%
- Displays component explanations, 6-month historical score trend chart, and actionable improvement suggestions.

### 8. Statement & Receipt Scanner (`/import`)
- Supports **PDF Bank Statements**, **CSV Statements**, **Receipt Images (OCR)**, and **Manual Staging Entry**.
- Validates file size (**max 5 MB**), file type allowlist (`.csv, .pdf, .png, .jpg, .jpeg, .webp, .txt`), and row integrity via **Zod schemas**.
- Staging table allows inline editing of **Date, Merchant Name, Description, Amount, and Category** before import, with automatic duplicate detection and configurable private storage retention (`Immediate delete`, `7 days`, `30 days`, `90 days`).

### 9. Hybrid AI Financial Assistant (`/ai-assistant`)
- Combines deterministic TypeScript/SQL/Python financial math with **OpenAI GPT-4o-mini** via secure Supabase Edge Functions (`supabase/functions/smartpaisa-ai/index.ts`).
- Answers affordability checks (*"Can I afford a ₹2,000 purchase this week?"*), month-over-month comparisons, next-month predictions, overspending audits, and personalized savings plans.
- Includes prompt-injection sanitization and privacy redaction.

### 10. Financial Literacy Centre (`/learn`) & Smart Notification Engine
- **10 Interactive INR Modules**: Personal Budgeting, Saving Money, Emergency Funds, UPI Safety, Online Payment Fraud Awareness, Credit Cards, Interest Rates, Loans & Debt Management, Subscription Management, and Student Financial Planning.
- Includes persistent learning progress tracking, personalized lesson recommendations, and an interactive quiz.
- **Smart Notification Engine**: Configurable preferences and deduplicated in-app alerts for 80% budget usage, budget exceeded, unusual expenditure, savings milestones, recurring payments, and monthly summaries.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts, React Hook Form, Zod
- **Backend & Database**: Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS), Supabase Private Storage (`financial-statements`), Supabase Edge Functions (`Deno`)
- **AI & ML**:
  - OpenAI `gpt-4o-mini` via secure Supabase Edge Function
  - Client-side TypeScript Deterministic + ML Inference Engine (`src/utils/mlEngine.ts`)
  - Python FastAPI Microservice (`ml_service/`): FastAPI, Pydantic, Pandas, NumPy, Scikit-learn, XGBoost
- **Testing**: Vitest, React Testing Library, Playwright, Pytest

---

## 🚀 Setup, Testing & Deployment Guide

### 1. Frontend & Unit Tests
```bash
# Install dependencies
npm install

# Run Vitest unit & integration test suite
npm test

# Run TypeScript compiler & Vite production build
npm run build

# Start local development server
npm run dev
```

### 2. Environment Variables (`.env`)
Create a `.env` file in the project root (see `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_ML_SERVICE_URL=http://localhost:8000
```
*Note: Never place `OPENAI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in client `VITE_` variables. Set `OPENAI_API_KEY` inside Supabase Edge Function Secrets.*

### 3. Database Migrations (Supabase)
Apply the SQL migrations in `supabase/migrations/` in chronological order:
1. `20261102000000_initial_schema.sql`
2. `20261103000000_smartpaisa_2_upgrade.sql`
3. `20261104000000_smartpaisa_2_complete_schema.sql`

### 4. Python FastAPI ML Service (`ml_service/`)
```bash
cd ml_service
pip install -r requirements.txt

# Run FastAPI server on port 8000
uvicorn main:app --reload --port 8000

# Run Pytest suite
pytest
```
