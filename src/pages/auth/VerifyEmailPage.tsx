import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { MailCheck, ArrowRight } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-elevated">
          <MailCheck className="w-7 h-7" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Verify Your Email Address
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          We have dispatched a verification link to your registered email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="fintech-card p-6 sm:p-8 text-center space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Please check your inbox (and spam folder) and click the verification link to activate all budgeting features and Supabase account sync.
          </p>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
            <Link to="/login">
              <Button variant="primary" className="w-full" icon={<ArrowRight className="w-4 h-4" />}>
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
