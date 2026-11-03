import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
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
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>SmartPaisa Legal Documentation</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Terms of Service
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Effective Date: 2 November 2026 | Last Updated: 2 November 2026
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the SmartPaisa personal finance management platform (&quot;Service&quot;), operated by <strong>[SmartPaisa Technologies Pvt. Ltd. Placeholder]</strong>, you agree to be legally bound by these Terms of Service. If you do not agree, you must discontinue using the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Eligibility</h2>
            <p>
              You must be at least <strong>18 years of age</strong> and legally capable of entering into binding contracts under the <em>Indian Contract Act, 1872</em>. By creating an account, you affirm that you satisfy this requirement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Nature of the Service (Non-Advisory Disclaimer)</h2>
            <p>
              SmartPaisa is an informational, self-service personal expense tracking and budgeting platform.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-700 space-y-1.5">
              <p className="font-bold text-slate-900">CRITICAL FINANCIAL DISCLAIMER:</p>
              <p>
                SmartPaisa, its software algorithms, and AI Assistant do <strong>NOT</strong> provide certified investment advice, financial planning, banking credit facilities, tax counsel, or wealth management under SEBI, RBI, or IRDAI regulations. All spending insights, category breakdowns, and AI recommendations are purely indicative and intended solely for personal informational tracking.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. User Account Security</h2>
            <p>
              You are responsible for safeguarding your login credentials. You agree to notify us immediately of any unauthorized account access. We are not liable for losses caused by compromised passwords.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">5. Prohibited Conduct</h2>
            <p>Users agree NOT to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>Reverse engineer, decompile, or breach security controls or Row Level Security policies.</li>
              <li>Input fraudulent, defamatory, or unlawful transaction records.</li>
              <li>Attempt prompt injection or malicious exploitation against the AI Assistant.</li>
              <li>Use automated bots or scrapers to extract application infrastructure.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">6. Intellectual Property</h2>
            <p>
              All software source code, visual dashboards, vector logos, and UI designs of SmartPaisa are the proprietary intellectual property of the operator.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">7. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute or proceeding arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bengaluru, Karnataka, India</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
