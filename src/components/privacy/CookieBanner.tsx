import React from 'react';
import { ShieldCheck, Cookie } from 'lucide-react';
import { useCookieConsent } from '@/context/CookieContext';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';

export const CookieBanner: React.FC = () => {
  const { bannerVisible, acceptAll, rejectOptional, openPreferences } = useCookieConsent();

  if (!bannerVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie Consent"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-slate-900/95 text-white backdrop-blur border-t border-slate-800 shadow-elevated animate-in slide-in-from-bottom duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-3xl">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Your Privacy & Cookie Choices</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                DPDP Act & GDPR Ready
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              We use strictly necessary cookies to keep your session secure and authenticate your financial records.
              Optional analytics help us optimize user experience. We never sell your personal financial data.
              Read our{' '}
              <Link to="/cookies" className="underline text-emerald-400 hover:text-emerald-300">
                Cookie Policy
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="underline text-emerald-400 hover:text-emerald-300">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Buttons with EQUAL PROMINENCE as required by Section 13 */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={openPreferences}
            className="text-xs text-slate-200 border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white"
          >
            Customize
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={rejectOptional}
            className="text-xs text-slate-200 border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white"
          >
            Reject Optional
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={acceptAll}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
};
