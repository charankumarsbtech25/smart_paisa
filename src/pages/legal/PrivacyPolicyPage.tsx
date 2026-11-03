import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to SmartPaisa Dashboard</span>
        </Link>

        <div className="fintech-card p-8 sm:p-12 space-y-6 text-slate-800 text-sm leading-relaxed">
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2.5 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>SmartPaisa Legal Documentation</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Effective Date: 2 November 2026 | Last Updated: 2 November 2026
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
            <strong>Legal Notice & Qualification:</strong> This policy has been drafted in plain language with reference to the principles of the <em>Digital Personal Data Protection (DPDP) Act, 2023</em> and applicable Indian Information Technology rules. It should be reviewed by qualified Indian legal counsel prior to formal commercial operations.
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Operational Entity & Introduction</h2>
            <p>
              SmartPaisa is operated by <strong>[Legal Operator Entity Placeholder: SmartPaisa Technologies Pvt. Ltd.]</strong>, with its principal place of operations located in Bengaluru, Karnataka, India (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;).
            </p>
            <p>
              We are committed to safeguarding the privacy and financial ledger data of our users, designed primarily for Indian college students and young adults aged 18 and older.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Age Eligibility & Verification</h2>
            <p>
              SmartPaisa is exclusively intended for individuals who are at least <strong>18 years of age</strong>. We do not knowingly or intentionally collect personal financial records or telemetry from children or minors under 18 years of age. If you become aware that a minor has created an account, please contact our grievance officer immediately for account deletion.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Data We Collect</h2>
            <p>We adhere to strict data-minimization principles:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>
                <strong>Account Credentials:</strong> Full name, verified email address, encrypted authentication hashes (managed via Supabase Auth).
              </li>
              <li>
                <strong>Self-Reported Financial Data:</strong> Transaction titles, amounts (in INR), categories (e.g. Food & Dining, Education), transaction dates, optional notes, and monthly budget targets.
              </li>
              <li>
                <strong>Telemetry & Device Diagnostics:</strong> IP address, browser user-agent, operating system, and performance metrics (collected only upon user cookie consent).
              </li>
              <li>
                <strong>AI Conversation Queries:</strong> Aggregated prompt text submitted to the SmartPaisa AI Assistant.
              </li>
            </ul>
            <p className="font-semibold text-slate-900">
              We NEVER request or store your Net Banking credentials, UPI PIN, Debit/Credit Card CVVs, or bank account passwords.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>To compute monthly spending summaries, category doughnut distributions, and velocity charts.</li>
              <li>To evaluate budget status and trigger 80% utilization threshold warnings.</li>
              <li>To securely route aggregated spending metrics to the AI Assistant for personalized financial mentoring.</li>
              <li>To comply with statutory financial audits, grievance requests, and security logging.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">5. Third-Party Service Providers</h2>
            <p>We work exclusively with vetted, ISO/SOC-2 compliant infrastructure partners:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Supabase:</strong> PostgreSQL database hosting, authentication, and encrypted Edge Functions.</li>
              <li><strong>OpenAI:</strong> Secure chat completion API for financial insights (transmitting aggregated figures only).</li>
              <li><strong>Vercel:</strong> Static and edge asset delivery with HTTPS enforcement.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">6. User Rights Under the DPDP Act 2023</h2>
            <p>As a Data Principal, you possess statutory rights including:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li><strong>Right to Access:</strong> View and export your complete transaction ledger at any time via the Privacy & Data page.</li>
              <li><strong>Right to Correction:</strong> Edit or update inaccurate expenses, budgets, and profile data directly in the app.</li>
              <li><strong>Right to Erasure (Right to be Forgotten):</strong> Permanently delete all account data and personal records using the self-serve deletion tool.</li>
              <li><strong>Right of Grievance Redressal:</strong> Direct escalated concerns to our designated Grievance Officer.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">7. Data Retention & Erasure</h2>
            <p>
              Your financial records are retained only for as long as your account is active. When an account erasure request is submitted via the Privacy & Data tab, all associated database records are cascade-deleted immediately. Automated database snapshot backups are purged on a rolling 30-day retention schedule.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">8. Grievance Officer & Contact</h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
              <p><strong>Designation:</strong> Data Protection & Grievance Officer</p>
              <p><strong>Company:</strong> SmartPaisa Technologies Pvt. Ltd. (Placeholder)</p>
              <p><strong>Email:</strong> privacy@smartpaisa.in (Placeholder)</p>
              <p><strong>Registered Office:</strong> Bengaluru, Karnataka, India - 560001 (Placeholder)</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
