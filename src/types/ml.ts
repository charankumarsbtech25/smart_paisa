import { ExpenseCategory } from './finance';

export interface CategoryPredictionResult {
  category: ExpenseCategory;
  subcategory?: string;
  confidence: number; // 0.0 to 1.0
  source: 'ml_model' | 'rule_engine' | 'merchant_lookup' | 'tfidf_logreg';
  suggestedAction: 'accept' | 'confirm_prompt';
}

export interface AnomalyDetectionResult {
  expenseId?: string;
  title?: string;
  amount?: number;
  category?: ExpenseCategory;
  date?: string;
  isAnomaly: boolean;
  anomalyScore: number; // 0.0 to 1.0
  anomalyType?:
    | 'high_amount'
    | 'unusual_category'
    | 'sudden_spike'
    | 'duplicate'
    | 'unexpected_recurring';
  algorithmUsed?: 'isolation_forest' | 'local_outlier_factor' | 'rolling_zscore' | 'threshold';
  explanation: string;
  zScore?: number;
}

export interface SpendingForecastResult {
  horizon: '7_days' | '30_days' | 'month_end';
  expectedAmount: number;
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number; // e.g. 0.95
  modelUsed: 'moving_average' | 'linear_regression' | 'random_forest' | 'xgboost';
  metrics: {
    mae: number;
    rmse: number;
    mape?: number;
  };
  overrunWarning: boolean;
  projectedOverrunAmount?: number;
  insufficientData?: boolean;
}

export interface ModelEvaluationItem {
  modelId: 'moving_average' | 'linear_regression' | 'random_forest' | 'xgboost';
  modelName: string;
  predictedMonthEnd: number;
  predictedNext7Days: number;
  predictedNext30Days: number;
  mae: number;
  rmse: number;
  mape: number;
  isRecommended: boolean;
  description: string;
}

export interface CategoryForecastItem {
  category: ExpenseCategory;
  currentMonthSpent: number;
  predictedMonthEnd: number;
  predictedNextMonth: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
}

export interface HistoricalFeaturesSummary {
  dailyAverageSpend: number;
  rolling7DaySpend: number;
  rolling30DaySpend: number;
  peakWeekday: string;
  weekendToWeekdayRatio: number;
  recurringTransactionsCount: number;
  recurringMonthlyTotal: number;
  budgetUtilizationPct: number;
  daysRecorded: number;
}

export interface BudgetRecommendation {
  category: ExpenseCategory;
  currentAverage: number;
  recommendedBudget: number;
  potentialSavings: number;
  dailyAllowanceShare: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  reasoning: string;
}

export interface ExtractedStatementItem {
  id: string;
  date: string;
  merchantName?: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  suggestedCategory: ExpenseCategory;
  confidence: number;
  isDuplicate: boolean;
  selected: boolean;
}
