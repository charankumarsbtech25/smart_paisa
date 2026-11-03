import { Expense, ExpenseCategory, EXPENSE_CATEGORIES, FinancialSummary, DailyExpenseItem, MonthlyExpenseItem, Income, FinancialHealthScore } from '@/types/finance';
import { getDaysInMonth, getShortMonthName } from './date';

/**
 * Centralized financial calculation utility for SmartPaisa.
 * Handles zero values, missing budgets, overspending, leap years, empty datasets, and edge cases.
 */
export function calculateFinancialSummary(
  expenses: Expense[],
  monthlyBudget: number | undefined | null,
  month: number,
  year: number,
  incomes: Income[] = []
): FinancialSummary {
  const safeBudget = monthlyBudget && !isNaN(monthlyBudget) && monthlyBudget > 0 ? monthlyBudget : 0;
  const daysInMonth = getDaysInMonth(year, month);

  // Determine elapsed days in the requested month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let daysElapsed = daysInMonth;
  if (year === currentYear && month === currentMonth) {
    daysElapsed = Math.min(now.getDate(), daysInMonth);
  } else if (year > currentYear || (year === currentYear && month > currentMonth)) {
    daysElapsed = 0; // Future month
  }

  const remainingDays = Math.max(0, daysInMonth - daysElapsed);

  // Filter expenses strictly belonging to requested month and year
  const monthExpenses = expenses.filter((exp) => {
    if (!exp.expense_date) return false;
    const [y, m] = exp.expense_date.split('-').map(Number);
    return y === year && m === month;
  });

  // Filter incomes strictly belonging to requested month and year
  const monthIncomes = (incomes || []).filter((inc) => {
    if (!inc.income_date) return false;
    const [y, m] = inc.income_date.split('-').map(Number);
    return y === year && m === month;
  });

  const totalExpenses = monthExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalIncome = monthIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0
    ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100 * 10) / 10)
    : 0;

  const remainingBudget = safeBudget > 0 ? safeBudget - totalExpenses : 0;
  const isOverBudget = safeBudget > 0 ? totalExpenses > safeBudget : false;

  const budgetUsagePercentage = safeBudget > 0
    ? Math.round((totalExpenses / safeBudget) * 100 * 10) / 10
    : 0;

  const isNearBudgetLimit = safeBudget > 0 && budgetUsagePercentage >= 80 && !isOverBudget;

  const dailyAverage = daysElapsed > 0
    ? Math.round((totalExpenses / daysElapsed) * 10) / 10
    : 0;

  // Formula: Remaining budget / Remaining days in the budget period
  const dailyAllowance = remainingDays > 0 && remainingBudget > 0
    ? Math.round((remainingBudget / remainingDays) * 10) / 10
    : 0;

  // Initialize all categories to 0
  const categoryTotals = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  // Tally category amounts
  monthExpenses.forEach((exp) => {
    const cat = exp.category as ExpenseCategory;
    if (cat && categoryTotals[cat] !== undefined) {
      categoryTotals[cat] += Number(exp.amount) || 0;
    } else {
      categoryTotals['Other'] += Number(exp.amount) || 0;
    }
  });

  // Determine highest spending category
  let highestCategory: { category: ExpenseCategory; amount: number } | null = null;
  for (const cat of EXPENSE_CATEGORIES) {
    const amt = categoryTotals[cat];
    if (amt > 0 && (!highestCategory || amt > highestCategory.amount)) {
      highestCategory = { category: cat, amount: amt };
    }
  }

  return {
    month,
    year,
    totalExpenses,
    totalIncome,
    netSavings,
    savingsRate,
    monthlyBudget: safeBudget,
    remainingBudget,
    budgetUsagePercentage,
    isOverBudget,
    isNearBudgetLimit,
    dailyAverage,
    remainingDays,
    dailyAllowance,
    highestCategory,
    categoryTotals,
    transactionCount: monthExpenses.length,
    daysInMonth,
    daysElapsed,
  };
}

/**
 * Generate daily progression series for line charts.
 */
export function calculateDailySpendingSeries(
  expenses: Expense[],
  month: number,
  year: number
): DailyExpenseItem[] {
  const daysInMonth = getDaysInMonth(year, month);
  const dailyMap: Record<number, number> = {};

  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap[d] = 0;
  }

  expenses.forEach((exp) => {
    if (!exp.expense_date) return;
    const [y, m, d] = exp.expense_date.split('-').map(Number);
    if (y === year && m === month && d >= 1 && d <= daysInMonth) {
      dailyMap[d] = (dailyMap[d] || 0) + (Number(exp.amount) || 0);
    }
  });

  const series: DailyExpenseItem[] = [];
  let cumulative = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayAmount = dailyMap[d] || 0;
    cumulative += dayAmount;
    series.push({
      day: d,
      dateStr: `${String(d).padStart(2, '0')} ${getShortMonthName(month)}`,
      amount: dayAmount,
      cumulativeAmount: cumulative,
    });
  }

  return series;
}

/**
 * Generate 6-month historical trends.
 */
export function calculateMonthlyTrends(
  expenses: Expense[],
  budgets: { month: number; year: number; amount: number }[],
  targetMonth: number,
  targetYear: number
): MonthlyExpenseItem[] {
  const trends: MonthlyExpenseItem[] = [];

  // Look back 6 months
  for (let i = 5; i >= 0; i--) {
    let m = targetMonth - i;
    let y = targetYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }

    const monthExpenses = expenses.filter((exp) => {
      if (!exp.expense_date) return false;
      const [expY, expM] = exp.expense_date.split('-').map(Number);
      return expY === y && expM === m;
    });

    const totalSpent = monthExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const budgetRecord = budgets.find((b) => b.year === y && b.month === m);

    trends.push({
      month: m,
      monthName: `${getShortMonthName(m)} '${String(y).slice(-2)}`,
      year: y,
      totalSpent,
      budget: budgetRecord ? Number(budgetRecord.amount) : 0,
    });
  }

  return trends;
}
