import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import {
  detectExpenseAnomalies,
  generateSmartBudgetRecommendations,
  calculateHistoricalHealthScores,
} from '@/utils/mlEngine';
import { formatINR } from '@/utils/currency';
import { Button } from '@/components/common/Button';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  BrainCircuit,
  ShieldAlert,
  Sparkles,
  CheckCircle,
  PiggyBank,
  Info,
  TrendingUp,
  Sliders,
} from 'lucide-react';

export const InsightsPage: React.FC = () => {
  const {
    expenses,
    budgets,
    currentBudget,
    savingsGoals,
    healthScore,
    selectedMonth,
    selectedYear,
    setCategoryBudget,
  } = useFinance();

  const [customThresholdINR, setCustomThresholdINR] = useState<number>(2000);
  const [dismissedAnomalies, setDismissedAnomalies] = useState<Record<number, boolean>>({});
  const [acceptedBudgets, setAcceptedBudgets] = useState<Record<string, boolean>>({});
  const [rejectedBudgets, setRejectedBudgets] = useState<Record<string, boolean>>({});

  // Anomaly detection combining Isolation Forest, LOF, Rolling Z-score, and user-specific threshold
  const anomalies = useMemo(() => {
    const base = detectExpenseAnomalies(expenses);
    return base.map((item) => {
      if (!item.isAnomaly && (item.amount || 0) >= customThresholdINR) {
        return {
          ...item,
          isAnomaly: true,
          anomalyScore: 0.76,
          anomalyType: 'high_amount' as const,
          algorithmUsed: 'threshold' as const,
          explanation: `Exceeds your custom alert threshold of ${formatINR(customThresholdINR)} ("${item.title}" at ${formatINR(item.amount || 0)}).`,
        };
      }
      return item;
    });
  }, [expenses, customThresholdINR]);

  const flaggedAnomalies = anomalies.filter((a) => a.isAnomaly);

  // Historical 6-month Financial Health Score trend
  const scoreHistory = useMemo(
    () =>
      calculateHistoricalHealthScores(
        expenses,
        budgets,
        savingsGoals,
        selectedMonth,
        selectedYear
      ),
    [expenses, budgets, savingsGoals, selectedMonth, selectedYear]
  );

  const budgetRecommendations = useMemo(() => {
    return generateSmartBudgetRecommendations(expenses, currentBudget?.amount || 0);
  }, [expenses, currentBudget]);

  const handleDismissAnomaly = (idx: number) => {
    setDismissedAnomalies((prev) => ({ ...prev, [idx]: true }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const explanations = healthScore.componentExplanations;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-teal-900/40">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>SmartPaisa Explainable AI & Anomaly Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Financial Health Score & Anomaly Detection
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Explainable 0–100 Financial Health Index, historical score trends, Isolation Forest & Z-score outlier alerts, and smart category budget recommendations.
          </p>
        </div>
      </div>

      {/* Financial Health Score Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Big Score Gauge */}
          <div className="flex flex-col items-center text-center sm:min-w-[220px]">
            <div
              className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shadow-inner ${getScoreColor(
                healthScore.overallScore
              )}`}
            >
              <span className="text-4xl font-black">{healthScore.overallScore}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider mt-0.5">/ 100</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg mt-3">
              {healthScore.grade} Health
            </h3>
            <p className="text-xs text-slate-500">Explainable Multi-Factor Index</p>
          </div>

          {/* 5 Component Bars with Individual Explanations */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>1. Budget Adherence (30% weight)</span>
                <span>{healthScore.budgetAdherence} / 30 pts</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${(healthScore.budgetAdherence / 30) * 100}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              {explanations && (
                <p className="text-[11px] text-slate-500 mt-1">{explanations.budgetAdherence}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>2. Savings Consistency (25% weight)</span>
                <span>{healthScore.savingsConsistency} / 25 pts</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${(healthScore.savingsConsistency / 25) * 100}%` }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
              {explanations && (
                <p className="text-[11px] text-slate-500 mt-1">{explanations.savingsConsistency}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>3. Expense Consistency & Velocity (20% weight)</span>
                <span>{healthScore.expenseVelocity} / 20 pts</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${(healthScore.expenseVelocity / 20) * 100}%` }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
              {explanations && (
                <p className="text-[11px] text-slate-500 mt-1">{explanations.expenseVelocity}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>4. Emergency Savings Progress (15% weight)</span>
                <span>{healthScore.emergencyFund} / 15 pts</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${(healthScore.emergencyFund / 15) * 100}%` }}
                  className="h-full bg-amber-500 rounded-full"
                />
              </div>
              {explanations && (
                <p className="text-[11px] text-slate-500 mt-1">{explanations.emergencyFund}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>5. Savings Goal Progress (10% weight)</span>
                <span>{healthScore.goalProgress} / 10 pts</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${(healthScore.goalProgress / 10) * 100}%` }}
                  className="h-full bg-teal-500 rounded-full"
                />
              </div>
              {explanations && (
                <p className="text-[11px] text-slate-500 mt-1">{explanations.goalProgress}</p>
              )}
            </div>
          </div>
        </div>

        {/* Historical Financial Health Score Trend Chart */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>6-Month Financial Health Score Trend</span>
              </h4>
              <p className="text-xs text-slate-500">
                Historical progression of your overall score across recent months
              </p>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreHistory} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} / 100`, 'Health Score']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="overallScore"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  fill="#ccfbf1"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Suggestions */}
        {healthScore.suggestions.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Personalized Recommendations to Boost Your Score
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {healthScore.suggestions.map((s, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs text-slate-700 flex items-start gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fairness & Methodology Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Methodology & Fairness Note:</strong> These weights (30/25/20/15/10) represent an initial product scoring framework, not a formal regulatory standard. Scores evaluate relative habits and percentages rather than absolute income levels, ensuring students and low-income users are never penalized for having a smaller income.
          </span>
        </div>
      </div>

      {/* Unusual Spending / Anomaly Detection Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <span>
                Unusual Spending & Anomaly Alerts (
                {flaggedAnomalies.filter((_, idx) => !dismissedAnomalies[idx]).length})
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Powered by Isolation Forest, Local Outlier Factor, Rolling Z-Score & Custom Thresholds. An unusual transaction does not automatically mean fraud.
            </p>
          </div>

          {/* User-Configurable Spending Alert Threshold */}
          <div className="bg-white rounded-xl px-3.5 py-2 border border-slate-200 flex items-center gap-3 text-xs shadow-2xs">
            <Sliders className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-slate-600 whitespace-nowrap">
              Alert Threshold: <strong className="text-slate-900">{formatINR(customThresholdINR)}</strong>
            </span>
            <input
              type="range"
              min={500}
              max={10000}
              step={250}
              value={customThresholdINR}
              onChange={(e) => setCustomThresholdINR(Number(e.target.value))}
              className="w-24 accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        {flaggedAnomalies.filter((_, idx) => !dismissedAnomalies[idx]).length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 text-xs text-slate-500">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No unusual spending spikes or duplicate charges detected above your threshold. Your transactions conform to expected patterns.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flaggedAnomalies.map((ano, idx) => {
              if (dismissedAnomalies[idx]) return null;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-amber-200/90 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-800 uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px]">
                          {ano.anomalyType?.replace('_', ' ') || 'Outlier'}
                        </span>
                        {ano.algorithmUsed && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {ano.algorithmUsed.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 text-[11px] font-semibold">
                        Anomaly Score: {Math.round((ano.anomalyScore || 0) * 100)}%
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {ano.explanation}
                    </h4>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Unusual pattern alert (Requires user verification)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDismissAnomaly(idx)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleDismissAnomaly(idx)}
                        className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                      >
                        Confirm Valid
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Smart Budget Recommendations Engine */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-indigo-600" />
            <span>Smart Budget Recommendations</span>
          </h2>
          <span className="text-xs text-slate-500">
            Deterministic + ML-assisted category allocations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetRecommendations.map((rec) => {
            const isAccepted = acceptedBudgets[rec.category];
            const isRejected = rejectedBudgets[rec.category];
            return (
              <div
                key={rec.category}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-900 text-sm">{rec.category}</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                      Save ~{formatINR(rec.potentialSavings)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Recommended Cap
                      </span>
                      <span className="text-xl font-extrabold text-slate-900">
                        {formatINR(rec.recommendedBudget)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Current Spend
                      </span>
                      <span className="text-sm font-semibold text-slate-600">
                        {formatINR(rec.currentAverage)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">{rec.reasoning}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    variant={isAccepted ? 'outline' : 'primary'}
                    size="sm"
                    className="flex-1 justify-center"
                    onClick={() => {
                      setAcceptedBudgets((prev) => ({ ...prev, [rec.category]: true }));
                      setRejectedBudgets((prev) => ({ ...prev, [rec.category]: false }));
                      setCategoryBudget(rec.category, rec.recommendedBudget, 'accepted', rec.recommendedBudget);
                    }}
                    disabled={isAccepted}
                  >
                    {isAccepted ? 'Accepted ✓' : 'Accept Target'}
                  </Button>
                  {!isAccepted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRejectedBudgets((prev) => ({ ...prev, [rec.category]: true }));
                        setCategoryBudget(rec.category, rec.currentAverage, 'rejected', rec.recommendedBudget);
                      }}
                      disabled={isRejected}
                    >
                      {isRejected ? 'Rejected' : 'Reject'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
