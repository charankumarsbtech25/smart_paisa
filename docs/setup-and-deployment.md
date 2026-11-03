# SmartPaisa Setup & Deployment Instructions

## 1. Quick Start (Local Development)

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm (v9+)

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The app runs out-of-the-box with immediate demo student access.

---

## 2. Supabase Cloud Configuration

### Step A: Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project named `smartpaisa`.
2. Under **Project Settings > API**, copy the `Project URL` and `anon public` key.

### Step B: Run Database Migrations
1. Open the **SQL Editor** in your Supabase dashboard.
2. Paste and run the SQL migration script located in:
   `supabase/migrations/20261102000000_init_smartpaisa.sql`
3. This creates all tables (`profiles`, `expenses`, `monthly_budgets`, `ai_conversations`, `ai_messages`, `privacy_requests`, `consent_records`), triggers, indexes, and enables Row Level Security (RLS) policies.

### Step C: Deploy Edge Function (SmartPaisa AI)
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Set OpenAI secrets in Supabase
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key
supabase secrets set OPENAI_MODEL=gpt-4o-mini

# Deploy Edge Function
supabase functions deploy smartpaisa-ai
```

### Step D: Configure Local Environment
Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Production Deployment (Vercel)

1. Push your repository to GitHub.
2. Log in to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your `smartpaisa` repository.
4. Framework Preset: **Vite**.
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy**. Vercel will build and deploy the production bundle using the included `vercel.json` rewrite and security headers configuration.
