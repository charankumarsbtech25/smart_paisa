# SmartPaisa Security Checklist & Audit

## 1. Authentication & Session Management
- [x] **Supabase Auth Integration**: Passwords are never handled or stored in plain-text. Scrypt/bcrypt password hashing executed strictly within Supabase Auth engine.
- [x] **Session Persistence**: JWT session tokens saved with `autoRefreshToken: true` and encrypted client persistence.
- [x] **Logout Flow**: Complete session invalidation via `supabase.auth.signOut()` and local storage purge.
- [x] **Protected Routes**: ProtectedRoute wrapper guarding `/`, `/expenses`, `/budgets`, `/analytics`, `/ai-assistant`, `/settings`, `/privacy-data`, `/help`.

## 2. Row Level Security (RLS) & IDOR Protection
- [x] **Strict PostgreSQL RLS Policies**: Enabled on every table (`profiles`, `expenses`, `monthly_budgets`, `ai_conversations`, `ai_messages`, `privacy_requests`, `consent_records`).
- [x] **Ownership Check (`auth.uid() = user_id`)**: Every SELECT, INSERT, UPDATE, and DELETE query validates the authenticated user ID.
- [x] **Cross-Account Data Isolation**: Even if a malicious user alters an ID parameter in a request, the database layer rejects access unless `auth.uid()` matches the target row.
- [x] **Zero Service-Role Key Exposure**: Only anonymous public keys (`VITE_SUPABASE_ANON_KEY`) are exposed to client code. Privileged service keys remain strictly on the backend.

## 3. Input Validation & Injection Defenses
- [x] **Zod Schema Validation**: Form submissions on expenses and budgets validate types, bounds, positive amounts, and allowed category enums.
- [x] **SQL Injection Defense**: Supabase parameterized client and prepared PostgreSQL queries prevent SQL injection.
- [x] **XSS Protection**: React automatic JSX string escaping prevents script injection. Notes and titles are escaped before CSV/JSON export.

## 4. AI Security & Prompt Injection Defense
- [x] **Serverless Edge Function (`smartpaisa-ai`)**: Client calls the Edge Function with authenticated Bearer JWT.
- [x] **Backend Identity Verification**: `user_id` is extracted strictly from the validated JWT token, never trusted from frontend payload.
- [x] **Data Minimization**: The AI provider only receives aggregated numbers (period spend, top 3 category names & totals, budget utilization percentage). No personal identifiable information (PII), emails, or credentials are sent.
- [x] **Bounded Queries**: Prompts are trimmed to max 500 characters and token completions are capped to prevent resource exhaustion.
- [x] **Anti-Hallucination & Math Fallback**: Deterministic mathematical engine used when API key is missing or service experiences latency, eliminating fabricated numbers.

## 5. Deployment Security Headers
- [x] `X-Content-Type-Options: nosniff`
- [x] `X-Frame-Options: DENY` (Clickjacking prevention)
- [x] `X-XSS-Protection: 1; mode=block`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy: camera=(), microphone=(), geolocation=()`
