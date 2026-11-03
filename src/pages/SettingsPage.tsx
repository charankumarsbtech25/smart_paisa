import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import {
  User,
  Shield,
  Key,
  Database,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { user, profile, updateProfile, updatePassword, isDemoMode } = useAuth();

  const [fullName, setFullName] = useState<string>(profile?.full_name || '');
  const [currency, setCurrency] = useState<string>(profile?.currency || 'INR');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Change password modal
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMessage(null);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        currency,
      });
      setStatusMessage('Profile successfully updated.');
    } catch {
      setStatusMessage('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setUpdatingPassword(true);
    setPasswordError(null);
    try {
      const res = await updatePassword(newPassword);
      if (res.error) {
        setPasswordError(res.error);
      } else {
        setPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        setStatusMessage('Password updated successfully.');
      }
    } catch {
      setPasswordError('Failed to update password');
    } finally {
      setUpdatingPassword(false);
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
          Account & System Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal profile, security credentials, and integration statuses
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

      {/* Profile Form Card */}
      <div className="fintech-card p-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
          <User className="w-4 h-4 text-emerald-600" />
          Personal Profile
        </h3>

        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
            />

            <Input
              label="Registered Email Address"
              value={user?.email || ''}
              disabled
              hint="Email changes require identity verification"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="currency-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Base Currency
              </label>
              <select
                id="currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="INR">INR (₹) — Indian Rupee</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Age Eligibility
              </span>
              <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Adult (18+ Years)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <Button type="submit" variant="primary" loading={savingProfile}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Security & Authentication Card */}
      <div className="fintech-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Security Credentials & Password
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Update your account password or rotate authentication keys.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPasswordModalOpen(true)}
        >
          Change Password
        </Button>
      </div>

      {/* Backend & Supabase Status Card */}
      <div className="fintech-card p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-emerald-600" />
          System Integrations & Architecture Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Supabase status */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Supabase PostgreSQL</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isSupabaseConfigured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isSupabaseConfigured ? 'Connected' : 'Standalone / Demo Store'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isSupabaseConfigured
                ? 'Active RLS policies enforced. Database isolated per authenticated user_id.'
                : 'Using resilient client-side persistent storage. To connect live PostgreSQL, provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'}
            </p>
          </div>

          {/* AI Provider Status */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">SmartPaisa AI Engine</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Provider configured: OpenAI GPT-4o-mini via secure serverless Edge Function with deterministic mathematical fallback.
            </p>
          </div>
        </div>

        <div className="pt-2 text-right">
          <Link
            to="/privacy-data"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
          >
            <span>Manage Privacy, Deletion & Consent Settings</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Password Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Change Account Password"
        description="Enter your new secure password below"
        maxWidth="sm"
      >
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={passwordError || undefined}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={updatingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
