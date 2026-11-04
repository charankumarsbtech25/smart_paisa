import React, { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ReceiptIndianRupee, PiggyBank, Sparkles, Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal';
import { CookieBanner } from '@/components/privacy/CookieBanner';
import { CookieCustomizeModal } from '@/components/privacy/CookieCustomizeModal';

export const AppLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState<boolean>(false);
  const location = useLocation();

  // Derive human-readable header title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/expenses')) return 'Transactions & Expenses';
    if (path.startsWith('/budgets')) return 'Monthly Budgets';
    if (path.startsWith('/analytics')) return 'Financial Analytics';
    if (path.startsWith('/ai-assistant')) return 'SmartPaisa AI Assistant';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/privacy-data')) return 'Privacy & Data Controls';
    if (path.startsWith('/help')) return 'Help & Support';
    return 'SmartPaisa';
  };

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-900 flex flex-col font-sans relative overflow-x-hidden">
      {/* Dynamic Animated Ambient Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Sidebar navigation */}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main content wrapper shifted right on desktop */}
      <div className="lg:pl-64 flex flex-col min-h-screen relative z-10">
        <Header
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenAddExpense={() => setAddExpenseModalOpen(true)}
          title={getPageTitle()}
        />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />
      </div>

      {/* Mobile Bottom Navigation Bar (iOS / Android Native App Feel) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-elevated"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
        aria-label="Mobile Bottom Navigation"
      >
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive || location.pathname === '/dashboard'
                ? 'text-emerald-600'
                : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <ReceiptIndianRupee className="w-5 h-5 mb-0.5" />
          <span>Expenses</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setAddExpenseModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-4"
          aria-label="Add Expense"
        >
          <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-emerald-700 mt-0.5">Add</span>
        </button>

        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <PiggyBank className="w-5 h-5 mb-0.5" />
          <span>Budgets</span>
        </NavLink>

        <NavLink
          to="/ai-assistant"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span>Ask AI</span>
        </NavLink>
      </nav>

      {/* Global Add Expense Modal */}
      <ExpenseFormModal
        isOpen={addExpenseModalOpen}
        onClose={() => setAddExpenseModalOpen(false)}
      />

      {/* Cookie Consent Banner and Customization Modal */}
      <CookieBanner />
      <CookieCustomizeModal />
    </div>
  );
};
