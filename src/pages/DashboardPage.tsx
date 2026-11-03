import React, { useMemo, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { BudgetOverview } from '@/components/dashboard/BudgetOverview';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { SpendingInsights } from '@/components/dashboard/SpendingInsights';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { MonthlyBarChart } from '@/components/charts/MonthlyBarChart';
import { DailyLineChart } from '@/components/charts/DailyLineChart';
import { calculateDailySpendingSeries, calculateMonthlyTrends } from '@/utils/calculations';
import {
  generateExpenseForecast,
  detectExpenseAnomalies,
  generateSmartBudgetRecommendations,
} from '@/utils/mlEngine';
import { formatINR } from '@/utils/currency';
import { getMonthName } from '@/utils/date';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Wallet,
  PiggyBank,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  TrendingUp,
  Target,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Cpu,
  Bot,
  RefreshCw,
  UserCheck,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    expenses,
    budgets,
    incomes,
    summary,
    healthScore,
    savingsGoals,
    selectedMonth,
    selectedYear,
  } = useFinance();
  const { isDemoMode, profile } = useAuth();

  const {
    totalExpenses,
    totalIncome,
    netSavings,
    savingsRate,
    monthlyBudget,
    remainingBudget,
    isOverBudget,
    isNearBudgetLimit,
    dailyAverage,
    remainingDays,
    dailyAllowance,
    highestCategory,
    categoryTotals,
    daysElapsed,
    daysInMonth,
  } = summary;

  // Compute daily series for the selected month
  const dailySeries = useMemo(
    () => calculateDailySpendingSeries(expenses, selectedMonth, selectedYear),
    [expenses, selectedMonth, selectedYear]
  );

  // Compute 6-month historical trends
  const monthlyTrends = useMemo(
    () => calculateMonthlyTrends(expenses, budgets, selectedMonth, selectedYear),
    [expenses, budgets, selectedMonth, selectedYear]
  );

  // ML End-of-Month Forecast
  const forecast = useMemo(
    () => generateExpenseForecast(expenses, monthlyBudget, selectedMonth, selectedYear),
    [expenses, monthlyBudget, selectedMonth, selectedYear]
  );

  // Anomaly Alerts for Dashboard
  const activeAnomalies = useMemo(
    () => detectExpenseAnomalies(expenses).filter((a) => a.isAnomaly),
    [expenses]
  );

  // Category Budget vs Actual Chart Data
  const budgetVsActualData = useMemo(() => {
    const recs = generateSmartBudgetRecommendations(expenses, monthlyBudget);
    return recs.slice(0, 6).map((r) => ({
      category: r.category.split(' ')[0],
      fullCategory: r.category,
      actual: summary.categoryTotals[r.category] || 0,
      budget: r.recommendedBudget,
    }));
  }, [expenses, monthlyBudget, summary.categoryTotals]);

  // Forecast vs Actual Cumulative Chart Data
  const forecastVsActualSeries = useMemo(() => {
    const data = [];
    const now = new Date();
    const isCurrentMonth =
      selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
    const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;

    let lastCumulative = 0;
    for (let i = 0; i < dailySeries.length; i++) {
      const item = dailySeries[i];
      if (item.day <= currentDay) {
        lastCumulative = item.cumulativeAmount;
        data.push({
          day: `D${item.day}`,
          actual: item.cumulativeAmount,
          forecast: item.cumulativeAmount,
        });
      } else {
        const daysAhead = item.day - currentDay;
        const dailySlope =
          remainingDays > 0
            ? (forecast.monthEnd.expectedAmount - lastCumulative) / remainingDays
            : dailyAverage;
        data.push({
          day: `D${item.day}`,
          actual: null,
          forecast: Math.max(0, Math.round(lastCumulative + dailySlope * daysAhead)),
        });
      }
    }
    return data;
  }, [dailySeries, selectedMonth, selectedYear, daysInMonth, remainingDays, forecast.monthEnd.expectedAmount, dailyAverage]);

  // Savings Growth Chart Data (6-Month Cumulative Savings + Goal Progress)
  const savingsGrowthData = useMemo(() => {
    let runningSavings = 12000; // Base starting savings cushion
    return monthlyTrends.map((m) => {
      const mIncomes = incomes
        .filter((inc) => {
          const [iy, im] = inc.income_date.split('-').map(Number);
          return iy === m.year && im === m.month;
        })
        .reduce((s, i) => s + Number(i.amount), 0);
      const effectiveIncome = mIncomes > 0 ? mIncomes : m.budget > 0 ? m.budget : 12000;
      const monthlySaved = Math.max(0, effectiveIncome - m.totalSpent);
      runningSavings += monthlySaved;
      return {
        month: m.monthName,
        monthlySaved,
        cumulativeSavings: runningSavings,
      };
    });
  }, [monthlyTrends, incomes]);

  // Personalized AI Monthly Financial Summary Generator
  const [summaryRegenerating, setSummaryRegenerating] = useState(false);
  const aiMonthlySummaryText = useMemo(() => {
    const monthName = getMonthName(selectedMonth);
    const topCat = highestCategory
      ? `${highestCategory.category} (${formatINR(highestCategory.amount)})`
      : 'no dominant category yet';
    const paceStatus = isOverBudget
      ? `exceeded your ${formatINR(monthlyBudget)} budget by ${formatINR(Math.abs(remainingBudget))}`
      : monthlyBudget > 0
      ? `used ${summary.budgetUsagePercentage}% of your ${formatINR(monthlyBudget)} budget with ${formatINR(remainingBudget)} remaining`
      : `spent ${formatINR(totalExpenses)} across ${summary.transactionCount} transactions`;

    const predNote = forecast.monthEnd.insufficientData
      ? 'Log at least 3 days of expenses to unlock ML end-of-month trajectory projections.'
      : `Our ${forecast.monthEnd.modelUsed.replace('_', ' ')} model projects your month-end expenditure at ${formatINR(forecast.monthEnd.expectedAmount)} (95% CI: ${formatINR(forecast.monthEnd.lowerBound)}–${formatINR(forecast.monthEnd.upperBound)}).`;

    return `In ${monthName} ${selectedYear}, you have ${paceStatus}. Your primary spending driver is ${topCat}, averaging ${formatINR(dailyAverage)}/day. ${predNote} Keep daily discretionary spends under ${formatINR(dailyAllowance > 0 ? dailyAllowance : 300)}/day to maintain your ${healthScore.overallScore}/100 (${healthScore.grade}) Financial Health Score.`;
  }, [
    selectedMonth,
    selectedYear,
    highestCategory,
    isOverBudget,
    monthlyBudget,
    remainingBudget,
    summary.budgetUsagePercentage,
    summary.transactionCount,
    totalExpenses,
    dailyAverage,
    forecast.monthEnd,
    dailyAllowance,
    healthScore,
  ]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  };

  const totalGoalTarget = savingsGoals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalGoalSaved = savingsGoals.reduce((s, g) => s + Number(g.current_amount), 0);
  const aggregateGoalPct =
    totalGoalTarget > 0 ? Math.min(100, Math.round((totalGoalSaved / totalGoalTarget) * 100)) : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Clear Demo Mode Data Provenance Banner when in Demo Mode */}
      {isDemoMode && (
        <motion.div
          variants={itemVariants}
          className="bg-amber-50 border border-amber-200/90 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900"
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Demo Student Dataset Active:</strong> Viewing sample financial records for{' '}
              <strong>{profile?.full_name || 'Aarav Sharma'}</strong>. Any expenses, budgets, or goals you add are saved to your session.
            </span>
          </div>
          <Link
            to="/expenses"
            className="font-bold text-amber-800 hover:text-amber-950 underline shrink-0"
          >
            Manage Ledger →
          </Link>
        </motion.div>
      )}

      {/* SmartPaisa 2.0 AI Summary & Safe Daily Spending Allowance Banner */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white border border-emerald-800/40 shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SmartPaisa 2.0 AI Financial Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {getMonthName(selectedMonth)} {selectedYear} Financial Command Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isOverBudget ? (
                <span className="text-rose-300 font-semibold">
                  ⚠️ You have exceeded your monthly budget target by {formatINR(Math.abs(remainingBudget))}. Switch to essential spending only.
                </span>
              ) : isNearBudgetLimit ? (
                <span className="text-amber-300 font-semibold">
                  ⚡ Budget utilization is at {summary.budgetUsagePercentage}%. Safe pacing recommended.
                </span>
              ) : (
                <span>
                  Ledger is healthy. You have utilized {summary.budgetUsagePercentage}% of your planned allocation with {remainingDays} days remaining.
                </span>
              )}
            </p>
          </div>

          {/* Daily Allowance, Predicted Month-End & Health Score Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            {/* Daily Spending Allowance */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[135px]">
              <span className="text-[11px] text-slate-300 font-medium block">Daily Safe Allowance</span>
              <p className="text-xl font-black text-emerald-400 mt-1">
                {dailyAllowance > 0 ? `${formatINR(dailyAllowance)}/d` : '₹0/d'}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Over remaining {remainingDays} days
              </span>
            </div>

            {/* Predicted End-of-Month Expenditure */}
            <Link
              to="/predictions"
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors min-w-[140px] block group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300 font-medium">Predicted Month-End</span>
                <Cpu className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <p className="text-xl font-black text-indigo-300 mt-1">
                {forecast.monthEnd.insufficientData
                  ? 'N/A'
                  : formatINR(forecast.monthEnd.expectedAmount)}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {forecast.monthEnd.overrunWarning ? '⚠️ Overrun risk' : '✓ Within trajectory'}
              </span>
            </Link>

            {/* Health Score Card */}
            <Link
              to="/insights"
              className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors min-w-[135px] block group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300 font-medium">Health Score</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300 transition-colors" />
              </div>
              <p className="text-xl font-black text-teal-300 mt-1">
                {healthScore.overallScore} <span className="text-xs font-semibold text-slate-400">/100</span>
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">
                {healthScore.grade} →
              </span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Monthly Expenses"
          amount={formatINR(totalExpenses)}
          subtitle={`${summary.transactionCount} transactions in ${getMonthName(selectedMonth)}`}
          icon={<Wallet className="w-5 h-5 text-emerald-600" />}
          highlight={isOverBudget ? 'red' : 'navy'}
          delay={0}
        />

        <StatCard
          title="Monthly Budget"
          amount={monthlyBudget > 0 ? formatINR(monthlyBudget) : 'Not Set'}
          subtitle={
            monthlyBudget > 0
              ? `${summary.budgetUsagePercentage}% utilized`
              : 'Click Budgets to set target'
          }
          icon={<PiggyBank className="w-5 h-5 text-emerald-600" />}
          highlight="navy"
          delay={0.06}
        />

        <StatCard
          title="Remaining Balance"
          amount={
            monthlyBudget > 0
              ? isOverBudget
                ? `-${formatINR(Math.abs(remainingBudget))}`
                : formatINR(remainingBudget)
              : 'N/A'
          }
          subtitle={
            monthlyBudget > 0
              ? isOverBudget
                ? 'Over budget limit'
                : isNearBudgetLimit
                ? 'Approaching 80% cap'
                : 'Safe savings margin'
              : 'Set budget to track'
          }
          icon={
            isOverBudget ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )
          }
          highlight={isOverBudget ? 'red' : isNearBudgetLimit ? 'amber' : 'emerald'}
          delay={0.12}
        />

        <StatCard
          title="Daily Average Velocity"
          amount={`${formatINR(dailyAverage)}/day`}
          subtitle={`Over ${daysElapsed} of ${daysInMonth} days`}
          icon={<CalendarDays className="w-5 h-5 text-blue-600" />}
          highlight="navy"
          delay={0.18}
        />
      </div>

      {/* Secondary FinTech Row: Savings Rate, Predicted Month-End, Savings Goals, Top Category */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Monthly Income & Savings Rate</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{formatINR(totalIncome)}</p>
            <span className="text-[11px] text-slate-400">Net: {formatINR(netSavings)}</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            {savingsRate}% Saved
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Predicted Month-End Spend</span>
            <p className="text-lg font-bold text-indigo-700 mt-0.5">
              {forecast.monthEnd.insufficientData
                ? 'Insufficient Data'
                : formatINR(forecast.monthEnd.expectedAmount)}
            </p>
            <span className="text-[11px] text-slate-400">
              Model: {forecast.monthEnd.modelUsed.replace('_', ' ')}
            </span>
          </div>
          <Link
            to="/predictions"
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          >
            Forecast →
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Savings Goals Progress</span>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">
              {formatINR(totalGoalSaved)}{' '}
              <span className="text-xs font-normal text-slate-400">of {formatINR(totalGoalTarget)}</span>
            </p>
            <span className="text-[11px] text-slate-400">{savingsGoals.length} active/completed goals</span>
          </div>
          <Link
            to="/savings"
            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100"
          >
            {aggregateGoalPct}%
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Top Spending Category</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {highestCategory ? `${highestCategory.category}` : 'None logged'}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {highestCategory ? formatINR(highestCategory.amount) : '₹0'}
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
            Top Driver
          </span>
        </div>
      </motion.div>

      {/* Personalized AI-Generated Monthly Financial Summary & Anomaly Notification Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* AI Monthly Summary Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white via-white to-emerald-50/40 rounded-2xl p-5 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Personalized AI Monthly Financial Summary
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Computed from your verified {getMonthName(selectedMonth)} {selectedYear} ledger
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSummaryRegenerating(true);
                  setTimeout(() => setSummaryRegenerating(false), 350);
                }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 inline-flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${summaryRegenerating ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-2">
              {aiMonthlySummaryText}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Budget Utilization: <strong>{summary.budgetUsagePercentage}%</strong> • Health Grade:{' '}
              <strong className="text-emerald-700">{healthScore.grade}</strong>
            </span>
            <Link to="/ai-assistant" className="font-bold text-emerald-700 hover:underline">
              Ask Follow-up in AI Mentor →
            </Link>
          </div>
        </div>

        {/* Unusual Spending & Savings Goals Snapshot Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Unusual Spending & Goal Alerts</span>
              </h3>
              <Link to="/insights" className="text-[11px] font-semibold text-emerald-600 hover:underline">
                View All
              </Link>
            </div>

            {activeAnomalies.length > 0 ? (
              <div className="space-y-2">
                {activeAnomalies.slice(0, 2).map((ano, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900"
                  >
                    <p className="font-bold">{ano.title || ano.category}</p>
                    <p className="text-[11px] text-amber-800 mt-0.5 line-clamp-2">{ano.explanation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No unusual spending spikes detected in your recent transactions.</span>
              </div>
            )}
          </div>

          {/* Mini Savings Goal Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                Active Savings Goals
              </span>
              <span className="text-emerald-700">{aggregateGoalPct}% Funded</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                style={{ width: `${aggregateGoalPct}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Budget Overview Progress & Thresholds */}
      <motion.div variants={itemVariants}>
        <BudgetOverview />
      </motion.div>

      {/* Primary Charts Grid: Category Doughnut + Monthly Expense Comparison */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart
          categoryTotals={categoryTotals}
          totalExpenses={totalExpenses}
        />
        <MonthlyBarChart data={monthlyTrends} />
      </motion.div>

      {/* Daily Spending Velocity Line Chart */}
      <motion.div variants={itemVariants}>
        <DailyLineChart data={dailySeries} />
      </motion.div>

      {/* Advanced Interactive Charts Grid: (1) Budget vs Actual, (2) Forecast vs Actual, (3) Savings Growth */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 4: Category Budget vs Actual Spending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Budget vs Actual by Category</h3>
            <p className="text-[11px] text-slate-500">
              Recommended category limits vs current monthly spend
            </p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActualData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    formatINR(Number(val)),
                    name === 'actual' ? 'Actual Spent' : 'Recommended Limit',
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="budget" name="Recommended Cap" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual Spent" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Forecast vs Actual Cumulative Trajectory */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Forecast vs Actual Spending</h3>
            <p className="text-[11px] text-slate-500">
              Recorded cumulative curve vs ML month-end trajectory
            </p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastVsActualSeries} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    val !== null ? formatINR(Number(val)) : '—',
                    name === 'actual' ? 'Actual Cumulative' : 'ML Forecast',
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  name="ML Forecast"
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  fill="#e0e7ff"
                  fillOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual Spend"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="#d1fae5"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Savings Growth Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Savings Growth Trajectory</h3>
            <p className="text-[11px] text-slate-500">
              6-month cumulative savings & net surplus growth
            </p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsGrowthData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    formatINR(Number(val)),
                    name === 'cumulativeSavings' ? 'Cumulative Savings' : 'Monthly Surplus',
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="cumulativeSavings"
                  name="Cumulative Savings"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fill="#ccfbf1"
                  fillOpacity={0.65}
                />
                <Area
                  type="monotone"
                  dataKey="monthlySaved"
                  name="Monthly Surplus"
                  stroke="#10b981"
                  fill="#d1fae5"
                  fillOpacity={0.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Spending Insights & AI Highlights */}
      <motion.div variants={itemVariants}>
        <SpendingInsights summary={summary} />
      </motion.div>

      {/* Recent 5 Transactions */}
      <motion.div variants={itemVariants}>
        <RecentTransactions expenses={expenses} />
      </motion.div>
    </motion.div>
  );
};
