import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import { ExpenseCategory } from '@/types/finance';
import { formatINR } from '@/utils/currency';
import { getMonthName } from '@/utils/date';
import { calculateFinancialSummary } from '@/utils/calculations';
import { generateSmartBudgetRecommendations } from '@/utils/mlEngine';
import { SetBudgetModal } from '@/components/dashboard/SetBudgetModal';
import { AnimatedCounter } from '@/components/common/AnimatedCounter';
import { Button } from '@/components/common/Button';
import {
  PiggyBank,
  Plus,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Sparkles,
  Check,
  X,
  Edit3,
  TrendingUp,
} from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const {
    budgets,
    categoryBudgets,
    expenses,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    setMonthlyBudget,
    setCategoryBudget,
  } = useFinance();
  const [budgetModalOpen, setBudgetModalOpen] = useState<boolean>(false);
  const [customizingCat, setCustomizingCat] = useState<ExpenseCategory | null>(null);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  const [applyNotice, setApplyNotice] = useState<string | null>(null);

  // Compute summary for the active selected month
  const activeBudget = budgets.find((b) => b.month === selectedMonth && b.year === selectedYear);
  const activeSummary = calculateFinancialSummary(
    expenses,
    activeBudget?.amount,
    selectedMonth,
    selectedYear
  );

  // Smart Budget Recommendations
  const recommendations = useMemo(
    () => generateSmartBudgetRecommendations(expenses, activeBudget?.amount || 0),
    [expenses, activeBudget]
  );

  const totalPotentialSavings = useMemo(
    () => recommendations.reduce((s, r) => s + r.potentialSavings, 0),
    [recommendations]
  );

  const totalRecommendedBudget = useMemo(
    () => recommendations.reduce((s, r) => s + r.recommendedBudget, 0),
    [recommendations]
  );

  // Sort historical budgets newest first
  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const handleAcceptRec = async (cat: ExpenseCategory, recAmt: number) => {
    await setCategoryBudget(cat, recAmt, 'accepted', recAmt);
    setApplyNotice(`Accepted recommended ${formatINR(recAmt)} cap for ${cat}.`);
  };

  const handleRejectRec = async (cat: ExpenseCategory, currentAmt: number, recAmt: number) => {
    await setCategoryBudget(cat, currentAmt, 'rejected', recAmt);
    setApplyNotice(`Dismissed recommendation for ${cat}; keeping current spending baseline.`);
  };

  const handleSaveCustomRec = async (cat: ExpenseCategory, recAmt: number) => {
    const val = parseFloat(customAmountInput);
    if (isNaN(val) || val < 0) return;
    await setCategoryBudget(cat, val, 'customized', recAmt);
    setCustomizingCat(null);
    setCustomAmountInput('');
    setApplyNotice(`Saved custom ${formatINR(val)} monthly limit for ${cat}.`);
  };

  const handleApplyTotalRecommended = async () => {
    if (totalRecommendedBudget <= 0) return;
    await setMonthlyBudget(totalRecommendedBudget, selectedMonth, selectedYear);
    setApplyNotice(
      `Updated ${getMonthName(selectedMonth)} ${selectedYear} monthly budget to ${formatINR(totalRecommendedBudget)} per your confirmation.`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Monthly Budget & Smart Recommendation Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Establish financial discipline, monitor monthly limits, and customize AI-assisted category budgets
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setBudgetModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          {activeBudget ? 'Update Current Budget' : 'Set Monthly Budget'}
        </Button>
      </div>

      {applyNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{applyNotice}</span>
          </div>
          <button
            onClick={() => setApplyNotice(null)}
            className="text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Month Featured Budget Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fintech-card p-6 sm:p-8 bg-gradient-to-br from-white via-white to-emerald-50/25 relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-sm"
            >
              <PiggyBank className="w-6 h-6" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {getMonthName(selectedMonth)} {selectedYear} Budget
                </h3>
                {activeSummary.isOverBudget ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 animate-pulse">
                    Overspent
                  </span>
                ) : activeSummary.isNearBudgetLimit ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    80% Threshold
                  </span>
                ) : activeSummary.monthlyBudget > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Healthy Pace
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    Not Set
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily Safe Spending Allowance:{' '}
                <strong className="text-emerald-700">{formatINR(activeSummary.dailyAllowance)}/day</strong> over{' '}
                {activeSummary.remainingDays} remaining days
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setBudgetModalOpen(true)}
            icon={<Sliders className="w-3.5 h-3.5" />}
          >
            Adjust Target
          </Button>
        </div>

        {/* Big numbers with AnimatedCounter */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Planned Budget
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              <AnimatedCounter value={activeSummary.monthlyBudget} />
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Total Spent
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              <AnimatedCounter value={activeSummary.totalExpenses} />
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Remaining Balance
            </span>
            <p
              className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                activeSummary.isOverBudget ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {activeSummary.monthlyBudget > 0 ? (
                activeSummary.isOverBudget ? (
                  <span>
                    -<AnimatedCounter value={Math.abs(activeSummary.remainingBudget)} />
                  </span>
                ) : (
                  <AnimatedCounter value={activeSummary.remainingBudget} />
                )
              ) : (
                'N/A'
              )}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Daily Allowance
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
              {formatINR(activeSummary.dailyAllowance)}
              <span className="text-xs font-semibold text-emerald-600">/d</span>
            </p>
          </div>
        </div>

        {/* Progress bar with motion.div animation */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Utilization Rate</span>
            <span className="text-slate-900 font-bold">
              {activeSummary.monthlyBudget > 0
                ? `${activeSummary.budgetUsagePercentage}%`
                : 'No budget target'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200/60 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, activeSummary.budgetUsagePercentage)}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full transition-colors duration-500 ${
                activeSummary.isOverBudget
                  ? 'bg-red-500'
                  : activeSummary.isNearBudgetLimit
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>
      </motion.div>

      {/* Smart Budget Recommendation Engine */}
      <div className="fintech-card p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI + Deterministic Budget Recommendation Engine</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Personalized Category Limits & Savings Targets
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generated from your historical spending patterns. Accept, reject, or customize each category limit—your budget is never modified without your explicit permission.
            </p>
          </div>

          {recommendations.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="text-slate-600 block text-[10px]">Realistic Monthly Savings Target</span>
                <strong className="text-emerald-800 text-sm">
                  +{formatINR(totalPotentialSavings)}/month
                </strong>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyTotalRecommended}
                icon={<Check className="w-3.5 h-3.5 text-emerald-600" />}
              >
                Apply {formatINR(totalRecommendedBudget)} Cap
              </Button>
            </div>
          )}
        </div>

        {recommendations.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            Record expenses to generate personalized category budget recommendations.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => {
              const savedDecision = categoryBudgets.find(
                (cb) =>
                  cb.category === rec.category &&
                  cb.month === selectedMonth &&
                  cb.year === selectedYear
              );
              const isCustomizing = customizingCat === rec.category;

              return (
                <div
                  key={rec.category}
                  className={`rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                    savedDecision?.recommendation_status === 'accepted' ||
                    savedDecision?.recommendation_status === 'customized'
                      ? 'bg-emerald-50/30 border-emerald-300'
                      : savedDecision?.recommendation_status === 'rejected'
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-900 text-sm">{rec.category}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.trend === 'increasing'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rec.trend === 'increasing' ? 'Overspending Risk' : 'Balanced'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Spend</span>
                        <span className="font-bold text-slate-700">{formatINR(rec.currentAverage)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          {savedDecision ? `Active (${savedDecision.recommendation_status})` : 'Recommended Cap'}
                        </span>
                        <span className="font-extrabold text-emerald-700">
                          {formatINR(
                            savedDecision ? savedDecision.allocated_amount : rec.recommendedBudget
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                      <span>Daily Share: ~{formatINR(rec.dailyAllowanceShare)}/day</span>
                      <span className="text-emerald-700 font-semibold">
                        Save {formatINR(rec.potentialSavings)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{rec.reasoning}</p>
                  </div>

                  {/* Accept / Reject / Customize Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {isCustomizing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={customAmountInput}
                          onChange={(e) => setCustomAmountInput(e.target.value)}
                          placeholder={String(rec.recommendedBudget)}
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCustomRec(rec.category, rec.recommendedBudget)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomizingCat(null)}
                          className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAcceptRec(rec.category, rec.recommendedBudget)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomizingCat(rec.category);
                            setCustomAmountInput(String(rec.recommendedBudget));
                          }}
                          className="py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" /> Customize
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRejectRec(rec.category, rec.currentAverage, rec.recommendedBudget)
                          }
                          className="py-1.5 px-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                          title="Reject Recommendation"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Budgets Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="fintech-card overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Historical Monthly Budgets
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and compare your budget discipline across previous months
            </p>
          </div>
        </div>

        {sortedBudgets.length === 0 ? (
          <div className="py-12 text-center text-slate-400 p-6">
            <PiggyBank className="w-10 h-10 stroke-1 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No Historical Budgets</p>
            <p className="text-xs text-slate-400 mt-1">
              Set your first monthly budget to start recording your financial targets.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Month & Year</th>
                  <th className="py-3 px-4 text-right">Target Budget (₹)</th>
                  <th className="py-3 px-4 text-right">Actual Spent (₹)</th>
                  <th className="py-3 px-4 text-right">Remaining (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedBudgets.map((b, idx) => {
                  const mSummary = calculateFinancialSummary(expenses, b.amount, b.month, b.year);
                  const isCurrent = b.month === selectedMonth && b.year === selectedYear;

                  return (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx, duration: 0.25 }}
                      className={`hover:bg-emerald-50/40 transition-colors ${
                        isCurrent ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                        {getMonthName(b.month)} {b.year}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        {formatINR(b.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        {formatINR(mSummary.totalExpenses)}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          mSummary.isOverBudget ? 'text-red-600' : 'text-emerald-700'
                        }`}
                      >
                        {mSummary.isOverBudget
                          ? `-${formatINR(Math.abs(mSummary.remainingBudget))}`
                          : formatINR(mSummary.remainingBudget)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {mSummary.isOverBudget ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3.5 h-3.5" /> Exceeded
                          </span>
                        ) : mSummary.isNearBudgetLimit ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3.5 h-3.5" /> Near Cap
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Within Cap
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMonth(b.month);
                            setSelectedYear(b.year);
                            setBudgetModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <SetBudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
      />
    </motion.div>
  );
};
