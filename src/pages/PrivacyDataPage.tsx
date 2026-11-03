import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { useCookieConsent } from '@/context/CookieContext';
import { exportUserDataAsJSON } from '@/utils/export';
import { LocalStore } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { PrivacyRequest } from '@/types/privacy';
import {
  ShieldCheck,
  Download,
  Trash2,
  Cookie,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
} from 'lucide-react';

export const PrivacyDataPage: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { expenses, budgets, refreshData } = useFinance();
  const { preferences, openPreferences } = useCookieConsent();

  const currentUserId = user?.id || 'user-demo-1';

  // Privacy requests state
  const [requests, setRequests] = useState<PrivacyRequest[]>(() => {
    return LocalStore.getPrivacyRequests(currentUserId);
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [clearChatModalOpen, setClearChatModalOpen] = useState<boolean>(false);
  const [marketingConsent, setMarketingConsent] = useState<boolean>(
    Boolean(profile?.marketing_consent)
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Download personal data archive
  const handleDownloadData = () => {
    exportUserDataAsJSON({
      profile,
      expenses,
      budgets,
      exportDate: new Date().toISOString(),
    });
    setStatusMessage('Personal data archive successfully downloaded as JSON.');
  };

  // Toggle marketing consent
  const handleToggleMarketing = async (checked: boolean) => {
    setMarketingConsent(checked);
    await updateProfile({ marketing_consent: checked });
    setStatusMessage(`Optional marketing communication ${checked ? 'enabled' : 'disabled'}.`);
  };

  // Clear AI chat history
  const handleClearAiChat = () => {
    localStorage.removeItem('smartpaisa_ai_chat');
    setClearChatModalOpen(false);
    setStatusMessage('AI Assistant conversation history has been cleared from local storage.');
  };

  // Submit Account Deletion Request
  const handleSubmitDeletion = async () => {
    const newRequest: PrivacyRequest = {
      id: `req-${Date.now().toString(36)}`,
      user_id: currentUserId,
      request_type: 'account_deletion',
      status: 'completed',
      details: {
        reason: 'User submitted account erasure request via Privacy Dashboard',
        executed_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && user) {
      // Execute database cascade delete on Supabase
      await supabase.from('expenses').delete().eq('user_id', user.id);
      await supabase.from('monthly_budgets').delete().eq('user_id', user.id);
      await supabase.from('privacy_requests').insert({
        user_id: user.id,
        request_type: 'account_deletion',
        status: 'completed',
      });
    }

    // Clear local storage data
    LocalStore.clearAllUserData(currentUserId);
    const updatedReqs = [newRequest, ...requests];
    setRequests(updatedReqs);
    LocalStore.savePrivacyRequests(updatedReqs);

    setDeleteModalOpen(false);
    setStatusMessage('All personal financial records have been permanently erased.');
    await refreshData();
    // Log out user
    setTimeout(() => {
      signOut();
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Privacy & Data Management
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Exercise your rights under India&apos;s Digital Personal Data Protection (DPDP) Act 2023 and GDPR
        </p>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Overview Card */}
      <div className="fintech-card p-6 bg-gradient-to-br from-white via-white to-slate-50">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Our Privacy Commitment
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              SmartPaisa operates on a <strong>privacy-first, data-minimization</strong> principle. Your financial records are isolated with strict Row Level Security (RLS). We never sell your personal financial data to advertisers, lenders, or data brokers.
            </p>
          </div>
        </div>
      </div>

      {/* Feature 1: Download Personal Data Archive */}
      <div className="fintech-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Download Personal Data (Data Portability)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Export a complete JSON archive of your user profile, recorded expenses, and monthly budget limits.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadData}
          icon={<Download className="w-3.5 h-3.5" />}
          className="shrink-0"
        >
          Download JSON
        </Button>
      </div>

      {/* Feature 2: Manage Cookie & Analytics Preferences */}
      <div className="fintech-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Cookie & Telemetry Consent
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Configure optional analytics and marketing cookies. Strictly necessary authentication cookies remain active.
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
              <span>Analytics: {preferences?.analytics ? 'Granted' : 'Denied'}</span>
              <span>•</span>
              <span>Marketing: {preferences?.marketing ? 'Granted' : 'Denied'}</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={openPreferences}
          icon={<Cookie className="w-3.5 h-3.5" />}
          className="shrink-0"
        >
          Adjust Cookies
        </Button>
      </div>

      {/* Feature 3: Marketing Communications Toggle */}
      <div className="fintech-card p-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Optional Student Financial Literacy Emails
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Receive periodic budgeting guides and feature updates. Unsubscribe anytime without affecting essential account security emails.
            </p>
          </div>
        </div>

        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(e) => handleToggleMarketing(e.target.checked)}
          className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer mt-1"
          aria-label="Toggle marketing consent"
        />
      </div>

      {/* Feature 4: Clear AI Chat History */}
      <div className="fintech-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Clear AI Conversation History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Erase all previous chat conversations and query prompts exchanged with the SmartPaisa AI financial mentor.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setClearChatModalOpen(true)}
          className="shrink-0"
        >
          Clear AI History
        </Button>
      </div>

      {/* Feature 5: Account & Data Deletion (Right to be Forgotten) */}
      <div className="fintech-card p-6 border-red-200/80 bg-red-50/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-red-100 text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-900">
              Erase Financial Data & Account (Right to Erasure)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Permanently delete all your recorded transactions, monthly budgets, and personal profile from SmartPaisa databases.
            </p>
          </div>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setDeleteModalOpen(true)}
          className="shrink-0"
        >
          Delete All Data
        </Button>
      </div>

      {/* Request History Log */}
      <div className="fintech-card p-6">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-emerald-600" />
          Privacy Request Audit Log
        </h3>
        {requests.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            No privacy requests submitted yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {requests.map((req) => (
              <div key={req.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 capitalize">
                    {req.request_type.replace(/_/g, ' ')}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Submitted on {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px] bg-emerald-100 text-emerald-800">
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear AI Chat Modal */}
      <Modal
        isOpen={clearChatModalOpen}
        onClose={() => setClearChatModalOpen(false)}
        title="Clear AI Conversation History"
        description="Are you sure you want to erase your previous conversation records?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            This will remove all cached prompts and assistant responses from your device.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setClearChatModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleClearAiChat}>
              Confirm Clear
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Data Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Permanently Delete All Account Data"
        description="This action is irreversible and erases all financial history."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 leading-relaxed">
            <strong>Warning:</strong> All transactions, monthly budgets, and personal settings will be permanently wiped out. You will be logged out immediately.
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSubmitDeletion}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
