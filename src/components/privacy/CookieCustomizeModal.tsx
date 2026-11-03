import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useCookieConsent } from '@/context/CookieContext';
import { Shield, BarChart, Megaphone } from 'lucide-react';

export const CookieCustomizeModal: React.FC = () => {
  const { customizeModalOpen, setCustomizeModalOpen, preferences, saveCustomPreferences } =
    useCookieConsent();

  const [analytics, setAnalytics] = useState<boolean>(false);
  const [marketing, setMarketing] = useState<boolean>(false);

  useEffect(() => {
    if (preferences) {
      setAnalytics(Boolean(preferences.analytics));
      setMarketing(Boolean(preferences.marketing));
    } else {
      // Per Section 13: NO preselected optional consent
      setAnalytics(false);
      setMarketing(false);
    }
  }, [preferences, customizeModalOpen]);

  const handleSave = () => {
    saveCustomPreferences({ analytics, marketing });
  };

  return (
    <Modal
      isOpen={customizeModalOpen}
      onClose={() => setCustomizeModalOpen(false)}
      title="Customize Cookie & Data Preferences"
      description="Select which optional data cookies you allow us to store on your device."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Strictly Necessary */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900">Strictly Necessary Cookies</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  Required
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Essential for authenticating your user account, securing Supabase sessions, and maintaining application integrity. These cannot be switched off.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={true}
            disabled={true}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 cursor-not-allowed opacity-75 mt-1"
            aria-label="Strictly necessary cookies always enabled"
          />
        </div>

        {/* Analytics Cookies */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3 hover:border-slate-300 transition-colors">
          <div className="flex items-start gap-3">
            <BarChart className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Performance & Analytics Cookies</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Allows anonymous telemetry on dashboard load speeds, feature popularity, and chart rendering performance to improve application stability.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => setAnalytics(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-1"
            aria-label="Enable performance and analytics cookies"
          />
        </div>

        {/* Marketing / Communications */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3 hover:border-slate-300 transition-colors">
          <div className="flex items-start gap-3">
            <Megaphone className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Educational & Feature Announcements</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Permits sending optional student financial literacy tips and notifications regarding new budgeting features.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-1"
            aria-label="Enable educational and marketing communications"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => setCustomizeModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </Modal>
  );
};
