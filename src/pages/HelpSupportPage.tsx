import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import {
  HelpCircle,
  Mail,
  Shield,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';

const FAQS = [
  {
    q: 'How does SmartPaisa help Indian college students and young adults?',
    a: 'SmartPaisa gives young adults complete control over their daily pocket money and expenses. By categorizing spends like canteen food, metro commutes, books, and recharges in INR, SmartPaisa helps you avoid running out of money before the end of the month.',
  },
  {
    q: 'How is my financial data protected?',
    a: 'We enforce PostgreSQL Row Level Security (RLS) at the database layer. This ensures that every database query is strictly scoped to your authenticated account. Neither other users nor third-party trackers can access your financial ledger.',
  },
  {
    q: 'What does the 80% budget alert mean?',
    a: 'When your total expenses reach 80% of your planned monthly budget, SmartPaisa automatically triggers an early-warning banner. This warning helps you moderate non-essential discretionary spending before you exceed your monthly limit.',
  },
  {
    q: 'Does SmartPaisa AI have access to my bank account or passwords?',
    a: 'No. SmartPaisa never asks for your net banking passwords, UPI PINs, or bank account credentials. The AI assistant receives only anonymized aggregated metrics (such as total spend and category percentages) to generate spending advice without compromising personal data.',
  },
  {
    q: 'How do I exercise my data deletion rights under the DPDP Act 2023?',
    a: 'You can go to the Privacy & Data section at any time to download your entire financial archive as a JSON file or submit a one-click permanent erasure request that immediately wipes your records.',
  },
];

export const HelpSupportPage: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [supportName, setSupportName] = useState<string>('');
  const [supportEmail, setSupportEmail] = useState<string>('');
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (supportEmail && supportMessage) {
      setSubmitted(true);
      setSupportName('');
      setSupportEmail('');
      setSupportMessage('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Help & Support Center
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Guides, frequently asked questions, and official grievance redressal information
        </p>
      </div>

      {/* FAQs Section */}
      <div className="fintech-card p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileQuestion className="w-5 h-5 text-emerald-600" />
          Frequently Asked Questions
        </h3>

        <div className="divide-y divide-slate-100">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={faq.q} className="py-3.5">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-semibold text-slate-900 text-sm hover:text-emerald-700 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Contact Form & Official Grievance Officer details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Form */}
        <div className="fintech-card p-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Mail className="w-4 h-4 text-emerald-600" />
            Contact Support
          </h3>

          {submitted ? (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Message Received</span>
              </div>
              <p>
                Thank you for contacting SmartPaisa Support. Our student care team will respond within 24 business hours.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmitted(false)}
                className="mt-2"
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <Input
                label="Your Name"
                placeholder="Aarav Sharma"
                value={supportName}
                onChange={(e) => setSupportName(e.target.value)}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="name@university.edu.in"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="support-msg"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  How can we help?
                </label>
                <textarea
                  id="support-msg"
                  rows={4}
                  required
                  placeholder="Describe your question or issue..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full">
                Submit Support Request
              </Button>
            </form>
          )}
        </div>

        {/* Regulatory & Grievance Officer Information */}
        <div className="fintech-card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-emerald-600" />
            Statutory & Grievance Information
          </h3>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              In accordance with the <em>Information Technology Act, 2000</em> and the <em>Digital Personal Data Protection Act, 2023</em>, users can reach out to our designated Grievance Officer:
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-slate-700">
              <p>
                <strong>Grievance Officer:</strong> Grievance Redressal Officer Placeholder
              </p>
              <p>
                <strong>Entity:</strong> SmartPaisa Technologies Pvt. Ltd. (Placeholder)
              </p>
              <p>
                <strong>Official Email:</strong> grievance@smartpaisa.in (Placeholder)
              </p>
              <p>
                <strong>Response Window:</strong> Within 48 hours of receipt
              </p>
              <p>
                <strong>Operating Jurisdiction:</strong> Bengaluru, Karnataka, India
              </p>
            </div>

            <p className="text-[11px] text-slate-400">
              SmartPaisa is an informational personal finance and expense ledger. It does not provide certified tax advisory, banking loans, or securities trading.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
