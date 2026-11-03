import React from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { MonthlyBarChart } from '@/components/charts/MonthlyBarChart';
import { DailyLineChart } from '@/components/charts/DailyLineChart';
import { calculateDailySpendingSeries, calculateMonthlyTrends } from '@/utils/calculations';
import { formatINR } from '@/utils/currency';
import { getMonthName } from '@/utils/date';
import { exportExpensesToCSV, exportUserDataAsJSON } from '@/utils/export';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
import {
  TrendingUp,
  CreditCard,
  Zap,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { expenses, budgets, summary, selectedMonth, selectedYear } = useFinance();
  const { profile } = useAuth();

  const {
    totalExpenses,
    monthlyBudget,
    remainingBudget,
    dailyAverage,
    categoryTotals,
    transactionCount,
  } = summary;

  // Series
  const dailySeries = calculateDailySpendingSeries(expenses, selectedMonth, selectedYear);
  const monthlyTrends = calculateMonthlyTrends(expenses, budgets, selectedMonth, selectedYear);

  // Payment method distribution
  const paymentMethodsMap: Record<string, number> = {};
  expenses
    .filter((e) => {
      const [y, m] = e.expense_date.split('-').map(Number);
      return y === selectedYear && m === selectedMonth;
    })
    .forEach((e) => {
      const pm = e.payment_method || 'Other';
      paymentMethodsMap[pm] = (paymentMethodsMap[pm] || 0) + Number(e.amount);
    });

  // Calculate highest single transaction this month
  const monthExpenses = expenses.filter((e) => {
    const [y, m] = e.expense_date.split('-').map(Number);
    return y === selectedYear && m === selectedMonth;
  });

  const largestExpense = monthExpenses.length > 0
    ? monthExpenses.reduce((max, cur) => (cur.amount > max.amount ? cur : max), monthExpenses[0])
    : null;

  const averageTransactionSize = transactionCount > 0
    ? Math.round(totalExpenses / transactionCount)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header & Export controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Financial Analytics & Trends
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Deep dive into your spending velocity, payment methods, and historical patterns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportExpensesToCSV(expenses)}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportUserDataAsJSON({
                profile,
                expenses,
                budgets,
                exportDate: new Date().toISOString(),
              })
            }
            icon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* 4 Analytical KPI Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="fintech-card p-5"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Average Ticket Size</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            <AnimatedCounter value={averageTransactionSize} />
          </p>
          <p className="text-xs text-slate-400 mt-1">Average per transaction</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="fintech-card p-5"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Highest Single Spend</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {largestExpense ? <AnimatedCounter value={largestExpense.amount} /> : '₹0'}
          </p>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {largestExpense ? largestExpense.title : 'No expenses recorded'}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="fintech-card p-5"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Daily Burn Rate</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            <AnimatedCounter value={dailyAverage} />
            <span className="text-sm font-semibold text-slate-500">/day</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Over {summary.daysElapsed} days in {getMonthName(selectedMonth)}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="fintech-card p-5"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Monthly Velocity</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {monthlyBudget > 0 ? `${summary.budgetUsagePercentage}%` : '0%'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {remainingBudget >= 0 ? `${formatINR(remainingBudget)} left` : 'Over budget'}
          </p>
        </motion.div>
      </div>

      {/* Payment Modes Analysis */}
      <div className="fintech-card p-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-emerald-600" />
          Payment Mode Breakdown ({getMonthName(selectedMonth)} {selectedYear})
        </h3>
        {Object.keys(paymentMethodsMap).length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No transactions found for payment method analysis.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(paymentMethodsMap).map(([mode, amt]) => {
              const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
              return (
                <motion.div
                  key={mode}
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:bg-emerald-50/40"
                >
                  <p className="text-xs font-semibold text-slate-600 truncate">{mode}</p>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    <AnimatedCounter value={amt} />
                  </p>
                  <p className="text-[11px] text-emerald-600 font-mono mt-0.5">{pct}% of spend</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart
          categoryTotals={categoryTotals}
          totalExpenses={totalExpenses}
        />
        <MonthlyBarChart data={monthlyTrends} />
      </div>

      {/* Full width daily trend */}
      <DailyLineChart data={dailySeries} />
    </motion.div>
  );
};
