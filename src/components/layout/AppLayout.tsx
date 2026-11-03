import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
