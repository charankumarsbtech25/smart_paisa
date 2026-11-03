import React from 'react';
import { Link } from 'react-router-dom';
import { Receipt, ArrowLeft } from 'lucide-react';

export const RefundPolicyPage: React.FC = () => {
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
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span>SmartPaisa Legal Documentation</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Refund & Cancellation Policy
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Effective Date: 2 November 2026 | Last Updated: 2 November 2026
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Current Free Platform Tier</h2>
            <p>
              SmartPaisa is currently provided as a <strong>free personal financial ledger and AI budgeting assistant</strong> for students and young adults. Users are not charged for tracking daily expenses, setting monthly budgets, viewing charts, or downloading data exports.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Optional Premium Upgrades (Future Offerings)</h2>
            <p>
              If SmartPaisa introduces optional paid features (such as multi-bank automated SMS ledger synchronization or advanced AI financial model tiers) in the future, the following conditions will govern all transactions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>
                <strong>7-Day Money-Back Guarantee:</strong> Eligible first-time subscribers may request a full refund within seven (7) calendar days of initial billing if unsatisfied with the premium features.
              </li>
              <li>
                <strong>Cancellation Policy:</strong> You may cancel recurring subscriptions at any time via Account Settings. Your premium access will continue until the end of the current billing cycle without subsequent charges.
              </li>
              <li>
                <strong>Processing Timeline:</strong> Approved refund requests are processed within 5 to 7 business days back to the original Indian payment method (UPI, Net Banking, or Card) via our RBI-licensed payment gateway partners.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Contact for Billing Inquiries</h2>
            <p>
              For any questions regarding billing or refund verification, contact our support team at:
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <p><strong>Email:</strong> billing@smartpaisa.in (Placeholder)</p>
              <p><strong>Support Window:</strong> Monday – Friday, 10:00 AM – 6:00 PM IST</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
