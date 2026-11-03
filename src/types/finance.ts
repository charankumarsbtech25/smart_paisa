export type ExpenseCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Transport'
  | 'Rent'
  | 'Education'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills & Recharge'
  | 'Subscriptions'
  | 'Health'
  | 'Personal Care'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Rent',
  'Education',
  'Shopping',
  'Entertainment',
  'Bills & Recharge',
  'Subscriptions',
  'Health',
  'Personal Care',
  'Other',
];

export type PaymentMethod =
  | 'UPI'
  | 'Cash'
  | 'Debit Card'
  | 'Credit Card'
  | 'Net Banking'
  | 'Other';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Cash',
  'Debit Card',
  'Credit Card',
  'Net Banking',
  'Other',
];

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  subcategory?: string;
  category_confirmed?: boolean;
  is_recurring?: boolean;
  expense_date: string; // YYYY-MM-DD
  payment_method?: PaymentMethod;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyBudget {
  id: string;
  user_id: string;
  month: number; // 1 - 12
  year: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryBudget {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  month: number;
  year: number;
  allocated_amount: number;
  recommended_amount?: number;
  recommendation_status?: 'pending' | 'accepted' | 'rejected' | 'customized';
  reasoning?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  month: number;
  year: number;
  totalExpenses: number;
  totalIncome: number;
  netSavings: number;
  savingsRate: number; // percentage
  monthlyBudget: number;
  remainingBudget: number;
  budgetUsagePercentage: number;
  isOverBudget: boolean;
  isNearBudgetLimit: boolean; // >= 80%
  dailyAverage: number;
  remainingDays: number;
  dailyAllowance: number; // remainingBudget / remainingDays
  highestCategory: { category: ExpenseCategory; amount: number } | null;
  categoryTotals: Record<ExpenseCategory, number>;
  transactionCount: number;
  daysInMonth: number;
  daysElapsed: number;
}

export interface Income {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  income_date: string; // YYYY-MM-DD
  recurrence?: 'one_time' | 'monthly' | 'weekly' | 'freelance';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type GoalStatus = 'in_progress' | 'completed' | 'paused' | 'cancelled';

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  planned_amount?: number;
  target_date: string; // YYYY-MM-DD
  category: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface SavingsContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  contribution_type: 'planned' | 'verified_deposit';
  is_verified: boolean;
  contribution_date: string;
  notes?: string;
  created_at: string;
}

export interface FinancialHealthScore {
  overallScore: number; // 0 - 100
  budgetAdherence: number; // 0 - 30
  savingsConsistency: number; // 0 - 25
  expenseVelocity: number; // 0 - 20
  emergencyFund: number; // 0 - 15
  goalProgress: number; // 0 - 10
  grade: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
  suggestions: string[];
  componentExplanations?: {
    budgetAdherence: string;
    savingsConsistency: string;
    expenseVelocity: string;
    emergencyFund: string;
    goalProgress: string;
  };
}

export interface HealthScoreHistoryPoint {
  month: string;
  overallScore: number;
  budgetAdherence: number;
  savingsConsistency: number;
}

export type AnomalyType =
  | 'high_amount'
  | 'unusual_category'
  | 'sudden_spike'
  | 'duplicate'
  | 'unexpected_recurring';
export type AnomalyStatus = 'unreviewed' | 'confirmed_valid' | 'flagged' | 'dismissed';

export interface AnomalyAlert {
  id: string;
  user_id: string;
  expense_id?: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  anomaly_type: AnomalyType;
  anomaly_score: number; // 0 to 1
  explanation: string;
  status: AnomalyStatus;
  created_at: string;
}

export interface ExpenseForecast {
  horizon: '7_days' | '30_days' | 'month_end';
  predictedAmount: number;
  lowerBound: number;
  upperBound: number;
  modelName: string;
  metrics: {
    mae?: number;
    rmse?: number;
    mape?: number;
  };
}

export type NotificationType =
  | 'budget_alert'
  | 'anomaly'
  | 'goal_milestone'
  | 'prediction_warning'
  | 'recurring_payment'
  | 'category_spike'
  | 'monthly_summary'
  | 'system';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  action_url?: string;
  dedup_key?: string;
  created_at: string;
}

export interface NotificationPreferences {
  budget_alerts_enabled: boolean;
  anomaly_alerts_enabled: boolean;
  goal_alerts_enabled: boolean;
  forecast_alerts_enabled: boolean;
  recurring_alerts_enabled: boolean;
  monthly_summary_enabled: boolean;
}

export interface ImportedTransaction {
  id: string;
  statement_id?: string;
  title: string;
  amount: number;
  expense_date: string;
  suggested_category: ExpenseCategory;
  confidence: number; // 0 to 1
  is_duplicate: boolean;
  status: 'staged' | 'confirmed' | 'ignored';
}

export interface DailyExpenseItem {
  day: number;
  dateStr: string;
  amount: number;
  cumulativeAmount: number;
}

export interface MonthlyExpenseItem {
  month: number;
  monthName: string;
  year: number;
  totalSpent: number;
  budget: number;
  savings?: number;
}
