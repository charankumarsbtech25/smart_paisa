import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cookie, Heart } from 'lucide-react';
import { useCookieConsent } from '@/context/CookieContext';

export const Footer: React.FC = () => {
  const { openPreferences } = useCookieConsent();

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 px-4 sm:px-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Purpose Notice */}
        <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
          <span className="font-semibold text-slate-700">SmartPaisa</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>Designed for Indian college students & young adults (18+)</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="flex items-center gap-1 text-slate-400">
            Made with{' '}
            <span className="inline-block animate-[pulse_1.5s_ease-in-out_infinite]">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            </span>{' '}
            in India
          </span>
        </div>

        {/* Legal & Cookie links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-medium text-slate-600">
          <Link to="/privacy" className="hover:text-emerald-600 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-emerald-600 transition-colors">
            Terms of Service
          </Link>
          <Link to="/refund-policy" className="hover:text-emerald-600 transition-colors">
            Refund Policy
          </Link>
          <Link to="/cookies" className="hover:text-emerald-600 transition-colors">
            Cookie Policy
          </Link>
          <button
            onClick={openPreferences}
            className="hover:text-emerald-600 transition-colors flex items-center gap-1 text-slate-600"
          >
            <Cookie className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cookie Settings</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 text-center">
        <p>
          © {new Date().getFullYear()} SmartPaisa Technologies Pvt. Ltd. (Operational Entity Placeholder). All rights reserved.
        </p>
        <p className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Strict Client-Side Encryption & Supabase Row Level Security</span>
        </p>
      </div>
    </footer>
  );
};
