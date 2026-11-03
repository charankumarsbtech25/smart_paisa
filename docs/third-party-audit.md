# SmartPaisa Third-Party & Dependency Audit

## 1. External Services Audit

| Service | Provider | Purpose | Data Shared | Privacy Policy / Compliance |
| :--- | :--- | :--- | :--- | :--- |
| **Supabase** | Supabase, Inc. | PostgreSQL database, Authentication, Edge functions | User ID, hashed credentials, expenses, budgets | SOC-2 Type II, ISO 27001, HIPAA compliant |
| **OpenAI** | OpenAI, LLC | Large Language Model completions for Financial Mentor | Anonymous aggregated financial numbers & prompt query. NO PII or credentials. | Enterprise zero-data-retention eligible |
| **Vercel** | Vercel, Inc. | Static frontend hosting, edge routing, CDN | Web traffic requests, IP addresses | ISO 27001, SOC-2 compliant |
| **Google Fonts** | Google LLC | Typeface delivery (`Inter`) | Font file asset retrieval | Privacy-preserving CDN |

## 2. Dependencies Audit

All project dependencies have been verified for license compatibility, active maintenance, and zero vulnerable packages:

| Package | Version | License | Justification |
| :--- | :--- | :--- | :--- |
| `react` / `react-dom` | `^18.3.1` | MIT | Core reactive UI engine |
| `react-router-dom` | `^6.28.0` | MIT | Client-side routing for SPA |
| `@supabase/supabase-js`| `^2.46.1` | MIT | Official Supabase client for database & auth |
| `lucide-react` | `^0.460.0` | ISC | Professional vector icons |
| `recharts` | `^2.13.3` | MIT | Accessible data visualization (charts) |
| `react-hook-form` | `^7.53.2` | MIT | Form performance & validation state management |
| `zod` | `^3.23.8` | MIT | Strict runtime type schema validation |
| `@hookform/resolvers` | `^3.9.1` | MIT | Connects Zod schemas to React Hook Form |
| `tailwindcss` | `^3.4.14` | MIT | Utility-first design system |
| `typescript` | `^5.6.3` | Apache-2.0 | Static type safety and compile-time verification |
| `vitest` | `^2.1.4` | MIT | Fast unit test runner |

## 3. Dark Pattern & Misleading Element Verification
- **Fake reviews & testimonials**: None present in the application.
- **Hidden fees**: Transparently marked as 100% free educational budgeting tool.
- **Fake urgency / countdowns**: None.
- **Preselected marketing consent**: Completely avoided. Optional marketing checkbox starts unchecked.
- **Cookie banner parity**: "Reject Optional" is styled with equal prominence to "Accept All".
