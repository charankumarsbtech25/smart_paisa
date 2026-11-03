import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Sparkles,
  Target,
  Info,
  X,
  Settings,
  Repeat,
  TrendingUp,
  FileBarChart,
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { NotificationPreferences } from '@/types/finance';
import { Link } from 'react-router-dom';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    notificationPreferences,
    markNotificationRead,
    clearAllNotifications,
    updateNotificationPreferences,
  } = useFinance();

  const [showSettings, setShowSettings] = useState<boolean>(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'budget_alert':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'anomaly':
      case 'category_spike':
        return <TrendingUp className="w-4 h-4 text-rose-500" />;
      case 'goal_milestone':
        return <Target className="w-4 h-4 text-emerald-500" />;
      case 'prediction_warning':
        return <Sparkles className="w-4 h-4 text-blue-500" />;
      case 'recurring_payment':
        return <Repeat className="w-4 h-4 text-purple-500" />;
      case 'monthly_summary':
        return <FileBarChart className="w-4 h-4 text-indigo-500" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  const preferenceItems: {
    key: keyof NotificationPreferences;
    label: string;
    desc: string;
  }[] = [
    {
      key: 'budget_alerts_enabled',
      label: '80% & 100% Budget Utilization Alerts',
      desc: 'Warn when monthly spending hits 80% or exceeds budget.',
    },
    {
      key: 'anomaly_alerts_enabled',
      label: 'Unusual Spending & Category Spikes',
      desc: 'Alert on statistical outliers and sudden category surges.',
    },
    {
      key: 'goal_alerts_enabled',
      label: 'Savings Goal Progress Milestones',
      desc: 'Celebrate 25%, 50%, 75%, and 100% goal achievements.',
    },
    {
      key: 'forecast_alerts_enabled',
      label: 'AI Forecast Overrun Warnings',
      desc: 'Notify when projected month-end spend exceeds budget.',
    },
    {
      key: 'recurring_alerts_enabled',
      label: 'Upcoming Recurring Payments',
      desc: 'Remind about rent, subscriptions, and recharge renewals.',
    },
    {
      key: 'monthly_summary_enabled',
      label: 'Monthly Financial Summaries',
      desc: 'Receive automated end-of-month financial health recaps.',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute right-4 top-16 w-88 sm:w-[410px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-slate-900">
                  {showSettings ? 'Notification Preferences' : 'Smart Notifications'}
                </h3>
                {!showSettings && (
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {notifications.filter((n) => !n.read).length} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowSettings((prev) => !prev)}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                    showSettings
                      ? 'bg-emerald-100 text-emerald-800 font-semibold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                  title="Configure notification preferences"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{showSettings ? 'Alerts' : 'Prefs'}</span>
                </button>
                {!showSettings && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="text-xs text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-200/50 rounded-lg flex items-center gap-1 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Read all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preferences View */}
            {showSettings ? (
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                <p className="text-[11px] text-slate-500">
                  Configure which in-app smart alerts you want to receive. External emails/SMS are never sent without explicit opt-in.
                </p>
                <div className="divide-y divide-slate-100">
                  {preferenceItems.map((pref) => (
                    <label
                      key={pref.key}
                      className="py-2.5 flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{pref.label}</p>
                        <p className="text-[11px] text-slate-500">{pref.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(notificationPreferences[pref.key])}
                        onChange={(e) =>
                          updateNotificationPreferences({ [pref.key]: e.target.checked })
                        }
                        className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              /* Notifications List View */
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No notifications right now. Everything is running smoothly!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 rounded-xl transition-all cursor-pointer ${
                        n.read
                          ? 'opacity-70 hover:bg-slate-50'
                          : 'bg-emerald-50/40 hover:bg-emerald-50/70 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white shadow-xs border border-slate-100">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {n.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(n.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          {n.action_url && (
                            <Link
                              to={n.action_url}
                              onClick={onClose}
                              className="inline-block mt-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              View details →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
