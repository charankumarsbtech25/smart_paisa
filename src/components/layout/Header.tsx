import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Plus, Calendar, Sparkles, Bell, FileDown } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useFinance } from '@/context/FinanceContext';
import { getMonthName } from '@/utils/date';
import { Link } from 'react-router-dom';
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer';

interface HeaderProps {
  onOpenMobileNav: () => void;
  onOpenAddExpense: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileNav,
  onOpenAddExpense,
  title,
}) => {
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, unreadNotificationCount } = useFinance();
  const [notifOpen, setNotifOpen] = useState<boolean>(false);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 transition-all">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
            {title || 'Financial Overview'}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Smart budgeting and expense tracking for young India
          </p>
        </div>
      </div>

      {/* Right controls: Month switcher & Quick Action */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Month selector widget */}
        <div className="flex items-center bg-slate-100/90 rounded-xl p-0.5 sm:p-1 border border-slate-200/60 text-[11px] sm:text-xs font-semibold text-slate-700 shadow-xs">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handlePrevMonth}
            className="px-1.5 sm:px-2 py-1 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-slate-800"
            title="Previous month"
            aria-label="Previous month"
          >
            ←
          </motion.button>
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-1 min-w-[68px] sm:min-w-[85px] justify-center overflow-hidden">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0 hidden xs:inline-block sm:inline-block" />
            <AnimatePresence mode="wait">
              <motion.span
                key={`${selectedMonth}-${selectedYear}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap"
              >
                {getMonthName(selectedMonth).slice(0, 3)} {selectedYear}
              </motion.span>
            </AnimatePresence>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleNextMonth}
            className="px-1.5 sm:px-2 py-1 hover:bg-white rounded-lg transition-colors text-slate-500 hover:text-slate-800"
            title="Next month"
            aria-label="Next month"
          >
            →
          </motion.button>
        </div>

        {/* Download Project Documentation PDF */}
        <a
          href="/SmartPaisa_Project_Documentation.pdf"
          download="SmartPaisa_Project_Documentation.pdf"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors"
          title="Download Project Documentation PDF"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Docs PDF</span>
        </a>

        {/* AI Assistant shortcut */}
        <Link to="/ai-assistant" className="hidden sm:inline-flex">
          <Button
            variant="outline"
            size="sm"
            icon={
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </motion.div>
            }
          >
            Ask AI
          </Button>
        </Link>

        {/* Notification Bell Button */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            )}
          </motion.button>
          <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* Quick Add Expense button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenAddExpense}
          icon={<Plus className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
};
