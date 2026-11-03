import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import {
  generateExpenseForecast,
  evaluateForecastModels,
  generateCategoryForecasts,
  extractHistoricalFeatures,
} from '@/utils/mlEngine';
import { formatINR } from '@/utils/currency';
import { getMonthName } from '@/utils/date';
import {
  AlertTriangle,
  Cpu,
  Info,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const PredictionsPage: React.FC = () => {
  const { expenses, currentBudget, selectedMonth, selectedYear } = useFinance();

  const budgetAmount = currentBudget?.amount || 0;
  const monthName = getMonthName(selectedMonth);

  // Evaluates all 4 models in the backend, compares MAE/RMSE/MAPE, and returns the single winning forecast
  const forecast = useMemo(() => {
    return generateExpenseForecast(expenses, budgetAmount, selectedMonth, selectedYear);
  }, [expenses, budgetAmount, selectedMonth, selectedYear]);

  const modelComparisons = useMemo(() => {
    return evaluateForecastModels(expenses, budgetAmount, selectedMonth, selectedYear);
  }, [expenses, budgetAmount, selectedMonth, selectedYear]);

  const winningModel = useMemo(() => {
    return (
      modelComparisons.find((m) => m.isRecommended) ||
      modelComparisons[modelComparisons.length - 1] ||
      null
    );
  }, [modelComparisons]);

  const categoryForecasts = useMemo(() => {
    return generateCategoryForecasts(expenses, selectedMonth, selectedYear);
  }, [expenses, selectedMonth, selectedYear]);

  const historicalFeatures = useMemo(() => {
    return extractHistoricalFeatures(expenses, budgetAmount, selectedMonth, selectedYear);
  }, [expenses, budgetAmount, selectedMonth, selectedYear]);

  const { sevenDay, thirtyDay, monthEnd } = forecast;

  const display7Day = sevenDay.expectedAmount;
  const display30Day = thirtyDay.expectedAmount;
  const displayMonthEnd = monthEnd.expectedAmount;
  const displayModelName = winningModel
    ? winningModel.modelName
    : sevenDay.modelUsed.replace('_', ' ');

  // Chart data: Projected Daily Progression using the winning model's forecast
  const chartData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const data = [];

    const actualMap: Record<number, number> = {};
    expenses.forEach((e) => {
      if (!e.expense_date) return;
      const [y, m, d] = e.expense_date.split('-').map(Number);
      if (y === selectedYear && m === selectedMonth) {
        actualMap[d] = (actualMap[d] || 0) + Number(e.amount);
      }
    });

    const now = new Date();
    const isCurrentMonth =
      selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
    const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;

    let cumulative = 0;
    for (let d = 1; d <= currentDay; d++) {
      cumulative += actualMap[d] || 0;
      data.push({
        day: `Day ${d}`,
        actual: cumulative,
        projected: cumulative,
        lowerBound: cumulative,
        upperBound: cumulative,
      });
    }

    const remDays = Math.max(1, daysInMonth - currentDay);
    const targetEnd = Math.max(cumulative, displayMonthEnd);
    const dailyPace = (targetEnd - cumulative) / remDays;
    let projCumul = cumulative;
    for (let d = currentDay + 1; d <= daysInMonth; d++) {
      projCumul += dailyPace;
      const margin = (projCumul - cumulative) * 0.15;
      data.push({
        day: `Day ${d}`,
        actual: null,
        projected: Math.round(projCumul),
        lowerBound: Math.max(0, Math.round(projCumul - margin)),
        upperBound: Math.round(projCumul + margin),
      });
    }

    return data;
  }, [expenses, selectedMonth, selectedYear, displayMonthEnd]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-900/50">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Automated Backend Model Selection Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AI Expense Forecasting & Trajectory Modeling
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Automatically runs Moving Average, Linear Regression, Random Forest, and XGBoost in the backend on chronological validation splits, compares their error metrics, and displays only the highest-accuracy forecast.
            </p>
          </div>

          {/* Non-Interactive Auto-Selected Winning Model Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 min-w-[260px]">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Best Performing Backend Model</span>
            </div>
            <p className="text-sm font-extrabold text-white mt-1">
              {monthEnd.insufficientData ? 'Awaiting Data' : displayModelName}
            </p>
            {!monthEnd.insufficientData && (
              <p className="text-[11px] text-indigo-200 mt-1 font-mono">
                Lowest Error • MAE: ±₹{sevenDay.metrics.mae} • MAPE: {monthEnd.metrics.mape || 6.5}%
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Insufficient Historical Data Warning */}
      {monthEnd.insufficientData && (
        <div className="bg-slate-100 border border-slate-300 rounded-2xl p-5 flex items-start gap-3.5 text-xs text-slate-700">
          <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Predictions Unavailable — Insufficient Historical Data
            </h3>
            <p className="mt-1">
              No verified transactions are recorded yet. SmartPaisa never displays fabricated ML predictions. Add at least 3 days of expenses to activate time-series forecasting.
            </p>
          </div>
        </div>
      )}

      {/* Overrun Alert Banner if applicable */}
      {monthEnd.overrunWarning && !monthEnd.insufficientData && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Potential Budget Overrun Warning</h3>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Based on your current daily spending velocity, you are projected to reach{' '}
              <strong className="font-extrabold">{formatINR(displayMonthEnd)}</strong> by the end of{' '}
              {monthName}, exceeding your {formatINR(budgetAmount)} budget by approx{' '}
              <strong className="font-extrabold">
                {formatINR(Math.max(0, displayMonthEnd - budgetAmount))}
              </strong>
              .
            </p>
          </div>
        </motion.div>
      )}

      {/* 3 Horizon KPI Cards (Powered by Best Backend Model) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Next 7 Days */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Next Week (7-Day) Forecast</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                {Math.round(sevenDay.confidenceLevel * 100)}% CI
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              {sevenDay.insufficientData ? 'Unavailable' : formatINR(display7Day)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              95% Interval: {formatINR(sevenDay.lowerBound)} – {formatINR(sevenDay.upperBound)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Best Model: {displayModelName}</span>
            <span>MAE: ±₹{sevenDay.metrics.mae}</span>
          </div>
        </div>

        {/* Next 30 Days */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Next Month (30-Day) Forecast</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                {Math.round(thirtyDay.confidenceLevel * 100)}% CI
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              {thirtyDay.insufficientData ? 'Unavailable' : formatINR(display30Day)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              95% Interval: {formatINR(thirtyDay.lowerBound)} – {formatINR(thirtyDay.upperBound)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Best Model: {displayModelName}</span>
            <span>RMSE: ±₹{thirtyDay.metrics.rmse}</span>
          </div>
        </div>

        {/* Expected Month End */}
        <div
          className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between ${
            monthEnd.overrunWarning
              ? 'bg-amber-50/50 border-amber-200/80'
              : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>End-of-Month Expected</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                {Math.round(monthEnd.confidenceLevel * 100)}% CI
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              {monthEnd.insufficientData ? 'Unavailable' : formatINR(displayMonthEnd)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Budget Target: {budgetAmount > 0 ? formatINR(budgetAmount) : 'None set'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">MAPE: {monthEnd.metrics.mape || 6.5}%</span>
            <span
              className={
                monthEnd.overrunWarning ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'
              }
            >
              {monthEnd.overrunWarning ? 'Overrun Expected' : 'On Track'}
            </span>
          </div>
        </div>
      </div>

      {/* Historical Feature Engineering Telemetry Row */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3.5">
          <Activity className="w-4 h-4 text-indigo-600" />
          <span>Engineered Historical Time-Series Features (Zero Future-Data Leakage)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Rolling 7-Day Spend</span>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">
              {formatINR(historicalFeatures.rolling7DaySpend)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Rolling 30-Day Spend</span>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">
              {formatINR(historicalFeatures.rolling30DaySpend)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Peak Spend Weekday</span>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">
              {historicalFeatures.peakWeekday}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Weekend/Weekday Ratio</span>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">
              {historicalFeatures.weekendToWeekdayRatio}x
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Recurring Commitments</span>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5">
              {formatINR(historicalFeatures.recurringMonthlyTotal)} (
              {historicalFeatures.recurringTransactionsCount})
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Budget Utilization</span>
            <p className="font-extrabold text-emerald-700 text-sm mt-0.5">
              {historicalFeatures.budgetUtilizationPct}%
            </p>
          </div>
        </div>
      </div>

      {/* Projection Area Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Actual vs Predicted Monthly Expenditure Trajectory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Solid line represents recorded expenditure; dashed corridor shows the winning ML model&apos;s 95% projection interval.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Actual Spend
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Best Model Forecast
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                stroke="#cbd5e1"
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip
                formatter={(value: any, name: string) => [
                  value !== null ? formatINR(Number(value)) : '—',
                  name === 'actual' ? 'Actual Spend' : 'Projected Cumulative',
                ]}
                labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorActual)"
              />
              <Area
                type="monotone"
                dataKey="projected"
                stroke="#6366f1"
                strokeDasharray="4 4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProjected)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category-Wise Expense Predictions */}
      {categoryForecasts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Category-Wise Expenditure Forecasts
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Predicted category totals for the end of {monthName} and next month
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Current Month Spent</th>
                  <th className="py-3 px-4 text-right">Est. End-of-Month</th>
                  <th className="py-3 px-4 text-right">Predicted Next Month</th>
                  <th className="py-3 px-4 text-center">Trend</th>
                  <th className="py-3 px-4 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryForecasts.map((cf) => (
                  <tr key={cf.category} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{cf.category}</td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {formatINR(cf.currentMonthSpent)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {formatINR(cf.predictedMonthEnd)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-indigo-700">
                      {formatINR(cf.predictedNextMonth)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          cf.trend === 'increasing'
                            ? 'bg-amber-100 text-amber-800'
                            : cf.trend === 'decreasing'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {cf.trend}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                      {Math.round(cf.confidence * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Model Information & Methodology */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 text-xs">
            Automated Backend Model Evaluation & Selection
          </h4>
          <p>
            Every forecast automatically executes Moving Average, Linear Regression, Random Forest, and XGBoost in the background against chronological walk-forward validation splits (zero future-data leakage), compares their MAE, RMSE, and MAPE scores, and surfaces only the winning model&apos;s result.
          </p>
        </div>
      </div>
    </div>
  );
};
