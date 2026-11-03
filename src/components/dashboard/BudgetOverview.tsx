import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatINR } from '@/utils/currency';
import { getMonthName } from '@/utils/date';
import { AlertTriangle, AlertCircle, CheckCircle2, Sliders, TrendingUp } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
import { SetBudgetModal } from './SetBudgetModal';

export const BudgetOverview: React.FC = () => {
  const { summary, selectedMonth, selectedYear } = useFinance();
  const [budgetModalOpen, setBudgetModalOpen] = useState<boolean>(false);

  const {
    monthlyBudget,
    totalExpenses,
    remainingBudget,
    budgetUsagePercentage,
    isOverBudget,
    isNearBudgetLimit,
  } = summary;

  // Determine progress bar color based on financial status
  const getProgressBarColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isNearBudgetLimit) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStatusBadge = () => {
    if (monthlyBudget === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          <Sliders className="w-3.5 h-3.5" /> Budget Not Set
        </span>
      );
    }
    if (isOverBudget) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Over Budget
        </span>
      );
    }
    if (isNearBudgetLimit) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> 80% Alert Threshold
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> On Track
      </span>
    );
  };

  return (
    <div className="fintech-card p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900">
              Budget Health & Utilization
            </h2>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking spending for {getMonthName(selectedMonth)} {selectedYear}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setBudgetModalOpen(true)}
          icon={<Sliders className="w-3.5 h-3.5" />}
        >
          {monthlyBudget > 0 ? 'Adjust Budget' : 'Set Monthly Budget'}
        </Button>
      </div>

      {/* Overspending Indicator Alert */}
      {isOverBudget && (
        <div
          role="alert"
          className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-red-800">
              Budget Exceeded by {formatINR(Math.abs(remainingBudget))}!
            </p>
            <p className="text-red-700 mt-0.5">
              You have spent {budgetUsagePercentage}% of your planned limit. Pause all non-essential shopping and entertainment purchases for the rest of {getMonthName(selectedMonth)}.
            </p>
          </div>
        </div>
      )}

      {/* 80% Warning Alert */}
      {isNearBudgetLimit && !isOverBudget && (
        <div
          role="alert"
          className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 animate-in fade-in"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold text-amber-800">
              Warning: 80% of Monthly Budget Utilized
            </p>
            <p className="text-amber-700 mt-0.5">
              You have {formatINR(remainingBudget)} left to spend this month. Monitor daily food and discretionary UPI expenses to avoid crossing your cap.
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar & Numerical Metrics */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Spent: {formatINR(totalExpenses)}</span>
          <span className="text-slate-900 font-bold">
            {monthlyBudget > 0 ? `${budgetUsagePercentage}% used` : 'No budget set'}
          </span>
          <span>Budget: {monthlyBudget > 0 ? formatINR(monthlyBudget) : '₹0'}</span>
        </div>

        {/* Progress Bar with smooth spring animation */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, budgetUsagePercentage)}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className={`h-full rounded-full ${getProgressBarColor()}`}
            role="progressbar"
            aria-valuenow={budgetUsagePercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Monthly budget usage percentage"
          />
        </div>
      </div>

      {/* 3 Metrics Grid with animated numbers */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center sm:text-left">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100/90 shadow-sm transition-colors"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
            Total Spent
          </p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">
            <AnimatedCounter value={totalExpenses} prefix="₹" />
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100/90 shadow-sm transition-colors"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
            Remaining Cap
          </p>
          <p
            className={`text-lg font-bold mt-0.5 ${
              isOverBudget ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {monthlyBudget > 0 ? (
              isOverBudget ? (
                <>
                  -₹<AnimatedCounter value={Math.abs(remainingBudget)} />
                </>
              ) : (
                <AnimatedCounter value={remainingBudget} prefix="₹" />
              )
            ) : (
              'N/A'
            )}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100/90 shadow-sm transition-colors"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
            Safe Daily Burn
          </p>
          <p className="text-lg font-bold text-slate-900 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-600 animate-gentle-bounce" />
            <span>
              {monthlyBudget > 0 && remainingBudget > 0 ? (
                <AnimatedCounter
                  value={Math.floor(
                    remainingBudget / Math.max(1, summary.daysInMonth - summary.daysElapsed)
                  )}
                  prefix="₹"
                  suffix="/day"
                />
              ) : (
                '₹0/day'
              )}
            </span>
          </p>
        </motion.div>
      </div>

      <SetBudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
      />
    </div>
  );
};
