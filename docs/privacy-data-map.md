# SmartPaisa Privacy & Data Map

## 1. Data Classification Inventory

| Data Field | Category | Purpose | Legal Basis (DPDP Act 2023) | Retention Period | Storage Location |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Email Address** | Account Identifier | Authentication & Account Recovery | Contractual Necessity | Duration of account lifecycle | Supabase Auth (`auth.users`) |
| **Full Name** | Profile Identifier | Personalization in Dashboard | User Consent / Profile | Duration of account lifecycle | Supabase (`public.profiles`) |
| **Age Verification Flag** | Compliance Flag | Certifies 18+ eligibility | Legal Compliance / Legitimate Uses | Duration of account lifecycle | Supabase (`public.profiles`) |
| **Expense Details** (Title, Category, Date, Amount) | Financial Data | Budget tracking, Category charts | Contractual Necessity / Service | Retained until user deletes or erases account | Supabase (`public.expenses`) |
| **Payment Method** (UPI, Cash, Card) | Financial Metadata | Payment mode analytics | User-entered (Optional) | Retained until user deletes | Supabase (`public.expenses`) |
| **Monthly Budget Targets** | Financial Planning | Budget health & threshold alerts | Contractual Necessity | Retained until updated or deleted | Supabase (`public.monthly_budgets`) |
| **AI Conversation Queries** | Communications | Answering spending questions | User Explicit Action | Erased on demand via Privacy tab | LocalStorage / Edge logs |
| **Cookie Consent Preferences** | Consent Records | Compliance with tracking laws | Legal Obligation | 12 Months from grant | Browser LocalStorage & Database |

## 2. Data Flow Architecture

```
User Browser
   │
   ├── (1) Authentication & Queries (Bearer JWT)
   ▼
Supabase Edge & API Gateway (SSL / TLS 1.3)
   │
   ├── (2) Row Level Security Verification (auth.uid() = user_id)
   ▼
PostgreSQL Database (Encrypted at rest)
   │
   └── (3) AI Assistant Aggregation Pipeline
           (Extracts only anonymous totals: Total ₹, Category breakdown)
           │
           ▼
     OpenAI Chat API (Zero Data Retention agreement option)
```

## 3. Data Subject Rights Implementation

1. **Right to Access / Data Portability**: Self-serve download of entire JSON archive available under `/privacy-data`.
2. **Right to Rectification**: In-app edit modals for expenses, monthly budgets, and profile data.
3. **Right to Erasure (Right to be Forgotten)**: Permanent account and ledger wipeout implemented via `/privacy-data` deletion action.
4. **Consent Withdrawal**: Toggle switches for marketing emails and cookie preferences with immediate persistence.
