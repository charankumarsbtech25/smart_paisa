import { describe, it, expect } from 'vitest';
import {
  calculateFinancialSummary,
  calculateDailySpendingSeries,
  calculateMonthlyTrends,
} from '../calculations';
import { formatINR, parseINR } from '../currency';
import { isLeapYear, getDaysInMonth } from '../date';
import { explainFinancialQuery } from '../aiKnowledgeEngine';
import { Expense } from '@/types/finance';

const MOCK_EXPENSES: Expense[] = [
  {
    id: '1',
    user_id: 'u1',
    title: 'Textbooks',
    amount: 1500,
    category: 'Education',
    expense_date: '2026-11-01',
    created_at: '2026-11-01',
    updated_at: '2026-11-01',
  },
  {
    id: '2',
    user_id: 'u1',
    title: 'Metro Pass',
    amount: 800,
    category: 'Transport',
    expense_date: '2026-11-02',
    created_at: '2026-11-02',
    updated_at: '2026-11-02',
  },
  {
    id: '3',
    user_id: 'u1',
    title: 'Cafeteria Lunch',
    amount: 200,
    category: 'Food & Dining',
    expense_date: '2026-11-02',
    created_at: '2026-11-02',
    updated_at: '2026-11-02',
  },
  // Previous month expense
  {
    id: '4',
    user_id: 'u1',
    title: 'October Shopping',
    amount: 2500,
    category: 'Shopping',
    expense_date: '2026-10-15',
    created_at: '2026-10-15',
    updated_at: '2026-10-15',
  },
];

describe('SmartPaisa Financial Calculations', () => {
  it('correctly aggregates monthly expenses for the selected month only', () => {
    const summary = calculateFinancialSummary(MOCK_EXPENSES, 10000, 11, 2026);
    expect(summary.totalExpenses).toBe(2500); // 1500 + 800 + 200
    expect(summary.remainingBudget).toBe(7500);
    expect(summary.budgetUsagePercentage).toBe(25);
    expect(summary.isOverBudget).toBe(false);
    expect(summary.isNearBudgetLimit).toBe(false);
    expect(summary.categoryTotals['Education']).toBe(1500);
    expect(summary.categoryTotals['Transport']).toBe(800);
    expect(summary.categoryTotals['Food & Dining']).toBe(200);
  });

  it('detects 80% threshold warning', () => {
    const summary = calculateFinancialSummary(MOCK_EXPENSES, 3000, 11, 2026);
    // 2500 / 3000 = 83.3%
    expect(summary.budgetUsagePercentage).toBe(83.3);
    expect(summary.isNearBudgetLimit).toBe(true);
    expect(summary.isOverBudget).toBe(false);
  });

  it('detects overspending state when expenses exceed budget', () => {
    const summary = calculateFinancialSummary(MOCK_EXPENSES, 2000, 11, 2026);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.remainingBudget).toBe(-500);
    expect(summary.budgetUsagePercentage).toBe(125);
  });

  it('handles zero or missing budget gracefully', () => {
    const summary = calculateFinancialSummary(MOCK_EXPENSES, 0, 11, 2026);
    expect(summary.monthlyBudget).toBe(0);
    expect(summary.remainingBudget).toBe(0);
    expect(summary.budgetUsagePercentage).toBe(0);
    expect(summary.isOverBudget).toBe(false);
  });

  it('handles completely empty datasets without errors', () => {
    const summary = calculateFinancialSummary([], 5000, 11, 2026);
    expect(summary.totalExpenses).toBe(0);
    expect(summary.remainingBudget).toBe(5000);
    expect(summary.budgetUsagePercentage).toBe(0);
    expect(summary.dailyAverage).toBe(0);
    expect(summary.transactionCount).toBe(0);
  });
});

describe('Date & Calendar Calculations', () => {
  it('correctly calculates leap years', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
  });

  it('calculates correct days in month including leap Februaries', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29);
    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(getDaysInMonth(2026, 11)).toBe(30);
    expect(getDaysInMonth(2026, 12)).toBe(31);
  });

  it('builds full daily progression series matching calendar month length', () => {
    const series = calculateDailySpendingSeries(MOCK_EXPENSES, 11, 2026);
    expect(series.length).toBe(30); // 30 days in November
    expect(series[0].amount).toBe(1500); // Nov 1
    expect(series[1].amount).toBe(1000); // Nov 2 (800 + 200)
    expect(series[1].cumulativeAmount).toBe(2500);
  });
});

describe('Indian Rupee (INR) Formatting', () => {
  it('formats amounts in Indian Rupee format', () => {
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(500)).toContain('500');
    expect(formatINR(150000, { compact: true })).toBe('₹1.5 L');
  });

  it('parses raw formatted currency strings correctly', () => {
    expect(parseINR('₹12,500')).toBe(12500);
    expect(parseINR(' 450.50 ')).toBe(450.5);
    expect(parseINR('')).toBe(0);
  });
});

describe('SmartPaisa Universal AI Explanation Engine', () => {
  const summary = calculateFinancialSummary(MOCK_EXPENSES, 10000, 11, 2026);
  const context = {
    summary,
    selectedMonth: 11,
    selectedYear: 2026,
    expenses: MOCK_EXPENSES,
  };

  it('explains specific user category spending', () => {
    const res = explainFinancialQuery('how much did i spend on food?', context);
    expect(res).toContain('Food & Dining');
    expect(res).toContain('₹200');
  });

  it('calculates SIP projections with mathematical formulas', () => {
    const res = explainFinancialQuery('calculate SIP 2000 per month for 5 years', context);
    expect(res).toContain('SIP Growth Projection');
    expect(res).toContain('₹2,000');
    expect(res).toContain('12%');
  });

  it('explains 50/30/20 budget breakdown for a given amount', () => {
    const res = explainFinancialQuery('explain 50/30/20 rule for 20000', context);
    expect(res).toContain('50/30/20');
    expect(res).toContain('50% Needs');
    expect(res).toContain('30% Wants');
    expect(res).toContain('20% Savings');
  });

  it('explains financial concepts like mutual funds, compounding, CIBIL and inflation', () => {
    const mfRes = explainFinancialQuery('what is a mutual fund?', context);
    expect(mfRes).toContain('Mutual Fund');
    expect(mfRes).toContain('Diversification');

    const cibilRes = explainFinancialQuery('what is a cibil credit score?', context);
    expect(cibilRes).toContain('CIBIL');
    expect(cibilRes).toContain('300');

    const infRes = explainFinancialQuery('explain inflation', context);
    expect(infRes).toContain('Inflation');
    expect(infRes).toContain('purchasing power');
  });

  it('answers open-ended queries gracefully with structured advice', () => {
    const generalRes = explainFinancialQuery('how to evaluate financial risk vs reward?', context);
    expect(generalRes).toContain('Smart Evaluation');
    expect(generalRes).toContain('Utility');
  });

  it('answers natural conversational questions about saving money and investing', () => {
    const saveRes = explainFinancialQuery('can you explain some about how i can save my money', context);
    expect(saveRes).toContain('Save Money');
    expect(saveRes).toContain('Pay Yourself First');
    expect(saveRes).toContain('50/30/20');

    const investRes = explainFinancialQuery('how do i start investing as a student?', context);
    expect(investRes).toContain('How to Start Investing');
    expect(investRes).toContain('Nifty 50');
  });

  it('answers conversational social queries like love, jokes, and greetings warmly', () => {
    const loveRes = explainFinancialQuery('i love you', context);
    expect(loveRes).toMatch(/(sweet|love|cheerleader|destiny)/i);

    const jokeRes = explainFinancialQuery('tell me a joke', context);
    expect(jokeRes).toMatch(/(wallet|joke|humor|bank account|stock)/i);

    const howAreYouRes = explainFinancialQuery('how are you today', context);
    expect(howAreYouRes).toContain('great');
  });
});
