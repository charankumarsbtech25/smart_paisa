import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ArrowLeft } from 'lucide-react';
import { useCookieConsent } from '@/context/CookieContext';
import { Button } from '@/components/common/Button';

export const CookiePolicyPage: React.FC = () => {
  const { openPreferences } = useCookieConsent();

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
          <div className="border-b border-slate-100 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <Cookie className="w-5 h-5 text-emerald-600" />
                <span>SmartPaisa Legal Documentation</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                Cookie Policy
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Effective Date: 2 November 2026 | Last Updated: 2 November 2026
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={openPreferences}
              icon={<Cookie className="w-3.5 h-3.5" />}
            >
              Adjust Cookie Preferences
            </Button>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. What Are Cookies?</h2>
            <p>
              Cookies and local storage objects are small text files placed on your browser or device when you visit web applications. They allow platforms to remember your authenticated session, maintain application security, and store interface preferences.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Categories of Cookies We Use</h2>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>A. Strictly Necessary (Essential) Cookies</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Always Active
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  These cookies are mandatory for the application to function. They store your Supabase JSON Web Token (JWT) session, authenticate database queries, and verify CSRF protection. They do not store advertising data.
                </p>
                <div className="mt-2 text-[11px] font-mono text-slate-500">
                  Examples: <code>sb-*-auth-token</code>, <code>smartpaisa_cookie_consent</code>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>B. Performance & Analytics Cookies</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Optional (Requires Consent)
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  These cookies gather anonymous aggregate metrics regarding dashboard load performance, chart rendering speeds, and UI errors. They are never enabled without your affirmative consent.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>C. Educational & Communication Cookies</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Optional (Requires Consent)
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Allows storing preferences regarding student financial literacy tips and onboarding guides.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. How to Withdraw or Change Your Consent</h2>
            <p>
              You can modify or withdraw your cookie consent at any time by clicking the <strong>Cookie Settings</strong> button in the footer or directly from the Privacy & Data dashboard.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={openPreferences}
              >
                Open Cookie Settings Modal
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
