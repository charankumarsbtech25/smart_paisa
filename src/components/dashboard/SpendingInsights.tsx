import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FinancialSummary } from '@/types/finance';
import { formatINR } from '@/utils/currency';
import { Sparkles, ArrowRight, Lightbulb, TrendingDown, Target } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface SpendingInsightsProps {
  summary: FinancialSummary;
}

export const SpendingInsights: React.FC<SpendingInsightsProps> = ({ summary }) => {
  const { categoryTotals, totalExpenses, monthlyBudget, remainingBudget, isOverBudget } = summary;

  // Find top category
  const sortedCategories = Object.entries(categoryTotals)
    .filter(([_, amt]) => amt > 0)
    .sort((a, b) => b[1] - a[1]);

  const topCategory = sortedCategories[0];
  const topCategoryPct = topCategory && totalExpenses > 0
    ? Math.round((topCategory[1] / totalExpenses) * 100)
    : 0;

  const insights = [
    {
      icon: TrendingDown,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-600',
      title: 'Highest Expense Driver',
      value: topCategory ? `${topCategory[0]} (${topCategoryPct}%)` : 'No expenses recorded',
      desc: topCategory
        ? `You have spent ${formatINR(topCategory[1])} here. Look out for frequent micro-transactions.`
        : 'Add your daily expenses to see category breakdowns.'
    },
    {
      icon: Target,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 text-blue-600',
      title: 'Daily Budget Pacing',
      value: monthlyBudget > 0 && remainingBudget > 0
        ? `${formatINR(
            Math.floor(remainingBudget / Math.max(1, summary.daysInMonth - summary.daysElapsed))
          )} / day allowance`
        : isOverBudget
        ? 'Limit exceeded'
        : 'Budget not defined',
      desc: monthlyBudget > 0
        ? `Your actual daily spending average is ${formatINR(summary.dailyAverage)}/day.`
        : 'Set a monthly budget to unlock daily spending pace recommendations.'
    },
    {
      icon: Lightbulb,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50 text-amber-500',
      title: 'Saving Recommendation',
      value: 'Micro-Saving Goal: ₹250 / week',
      desc: 'Cutting just one food delivery or auto ride per week puts ₹1,000 back into your semester savings!'
    }
  ];

  return (
    <div className="fintech-card p-6 bg-gradient-to-br from-white via-white to-emerald-50/20">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600"
          >
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Smart Spending Insights
            </h3>
            <p className="text-xs text-slate-500">
              Automated financial intelligence for student budgets
            </p>
          </div>
        </div>

        <Link to="/ai-assistant">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Chat with AI
          </Button>
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx, duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className={`p-1.5 rounded-lg ${item.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span>{item.title}</span>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">
                {item.value}
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
