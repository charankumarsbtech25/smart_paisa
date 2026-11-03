import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptIndianRupee,
  PiggyBank,
  BarChart3,
  Sparkles,
  Settings,
  ShieldCheck,
  HelpCircle,
  LogOut,
  X,
  UserCheck,
  Target,
  TrendingUp,
  BrainCircuit,
  GraduationCap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Transactions', path: '/expenses', icon: ReceiptIndianRupee },
  { name: 'Budgets', path: '/budgets', icon: PiggyBank },
  { name: 'Savings Goals', path: '/savings', icon: Target },
  { name: 'ML Forecasts', path: '/predictions', icon: TrendingUp, badge: 'ML' },
  { name: 'Insights & Health', path: '/insights', icon: BrainCircuit },
  { name: 'Learn Finance', path: '/learn', icon: GraduationCap },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles, badge: 'AI' },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Privacy & Data', path: '/privacy-data', icon: ShieldCheck },
  { name: 'Help & Support', path: '/help', icon: HelpCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, profile, signOut, isDemoMode } = useAuth();
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900/95 backdrop-blur-xl text-slate-200 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
        <NavLink to="/" className="flex items-center gap-3 group" onClick={onCloseMobile}>
          <motion.div
            whileHover={{ scale: 1.08, rotate: 6 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600/30 to-emerald-400/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-950 relative overflow-hidden"
          >
            <span className="font-extrabold text-xl text-emerald-400">₹</span>
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                SmartPaisa
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                IN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">AI Personal Finance</p>
          </div>
        </NavLink>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Demo Mode banner if active */}
      {isDemoMode && (
        <div className="mx-4 mt-3 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2 animate-pulse">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Demo Student Mode (Active)</span>
        </div>
      )}

      {/* Navigation Links with animated sliding pill */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/' || location.pathname === '/dashboard'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors group ${isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                }`}
            >
              {/* Active Tab Sliding Background Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeSidebarIndicator"
                  className="absolute inset-0 bg-emerald-600 rounded-xl shadow-sm shadow-emerald-900"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Hover effect when inactive */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl group-hover:bg-slate-800/60 transition-colors" />
              )}

              <div className="relative z-10 flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'opacity-80 group-hover:opacity-100'
                    }`}
                />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span className="relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Card & Logout */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-sm font-semibold text-emerald-300 shrink-0">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {profile?.full_name || 'Student User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || 'user@smartpaisa.in'}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700/50 transition-colors active:scale-90"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Drawer with spring animation */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={onCloseMobile}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
