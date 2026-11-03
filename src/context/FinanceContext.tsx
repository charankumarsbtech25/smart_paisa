import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Expense,
  MonthlyBudget,
  CategoryBudget,
  FinancialSummary,
  ExpenseCategory,
  PaymentMethod,
  Income,
  SavingsGoal,
  SavingsContribution,
  NotificationItem,
  NotificationPreferences,
  FinancialHealthScore,
} from '@/types/finance';
import { calculateFinancialSummary } from '@/utils/calculations';
import { calculateFinancialHealthScore, detectExpenseAnomalies } from '@/utils/mlEngine';
import { getCurrentMonthAndYear, getMonthName } from '@/utils/date';
import { formatINR } from '@/utils/currency';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LocalStore, DEFAULT_NOTIFICATION_PREFS } from '@/lib/storage';

interface ExpenseInput {
  title: string;
  amount: number;
  category: ExpenseCategory;
  subcategory?: string;
  category_confirmed?: boolean;
  is_recurring?: boolean;
  expense_date: string;
  payment_method?: PaymentMethod;
  notes?: string;
}

interface IncomeInput {
  source: string;
  amount: number;
  income_date: string;
  recurrence?: 'one_time' | 'monthly' | 'weekly' | 'freelance';
  notes?: string;
}

interface SavingsGoalInput {
  name: string;
  target_amount: number;
  target_date: string;
  category?: string;
}

interface FinanceContextType {
  expenses: Expense[];
  budgets: MonthlyBudget[];
  categoryBudgets: CategoryBudget[];
  incomes: Income[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  notifications: NotificationItem[];
  notificationPreferences: NotificationPreferences;
  unreadNotificationCount: number;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  summary: FinancialSummary;
  healthScore: FinancialHealthScore;
  currentBudget: MonthlyBudget | undefined;
  loading: boolean;
  addExpense: (data: ExpenseInput) => Promise<{ success: boolean; error?: string }>;
  updateExpense: (id: string, data: Partial<ExpenseInput>) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;
  setMonthlyBudget: (amount: number, month?: number, year?: number) => Promise<{ success: boolean; error?: string }>;
  setCategoryBudget: (
    category: ExpenseCategory,
    amount: number,
    status?: 'accepted' | 'rejected' | 'customized',
    recommendedAmount?: number
  ) => Promise<{ success: boolean; error?: string }>;
  addIncome: (data: IncomeInput) => Promise<{ success: boolean; error?: string }>;
  deleteIncome: (id: string) => Promise<{ success: boolean; error?: string }>;
  addSavingsGoal: (data: SavingsGoalInput) => Promise<{ success: boolean; error?: string }>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<{ success: boolean; error?: string }>;
  deleteSavingsGoal: (id: string) => Promise<{ success: boolean; error?: string }>;
  addSavingsContribution: (
    goalId: string,
    amount: number,
    notes?: string,
    contributionType?: 'verified_deposit' | 'planned'
  ) => Promise<{ success: boolean; error?: string }>;
  verifyPlannedContribution: (contributionId: string) => Promise<{ success: boolean; error?: string }>;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => void;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentDefaults = getCurrentMonthAndYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDefaults.month);
  const [selectedYear, setSelectedYear] = useState<number>(currentDefaults.year);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsContributions, setSavingsContributions] = useState<SavingsContribution[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() =>
    LocalStore.getNotificationPreferences()
  );
  const [loading, setLoading] = useState<boolean>(true);

  const currentUserId = user?.id || 'user-demo-1';

  const loadData = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setBudgets([]);
      setCategoryBudgets([]);
      setIncomes([]);
      setSavingsGoals([]);
      setSavingsContributions([]);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        const [expRes, budRes, catBudRes, incRes, goalRes, contribRes, notifRes] = await Promise.all([
          supabase.from('expenses').select('*').eq('user_id', user.id).order('expense_date', { ascending: false }),
          supabase.from('monthly_budgets').select('*').eq('user_id', user.id),
          supabase.from('category_budgets').select('*').eq('user_id', user.id),
          supabase.from('incomes').select('*').eq('user_id', user.id).order('income_date', { ascending: false }),
          supabase.from('savings_goals').select('*').eq('user_id', user.id),
          supabase.from('savings_contributions').select('*').eq('user_id', user.id).order('contribution_date', { ascending: false }),
          supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ]);

        if (expRes.data) setExpenses(expRes.data as Expense[]);
        if (budRes.data) setBudgets(budRes.data as MonthlyBudget[]);
        if (catBudRes.data) setCategoryBudgets(catBudRes.data as CategoryBudget[]);
        if (incRes.data) setIncomes(incRes.data as Income[]);
        if (goalRes.data) setSavingsGoals(goalRes.data as SavingsGoal[]);
        if (contribRes.data) setSavingsContributions(contribRes.data as SavingsContribution[]);
        if (notifRes.data) setNotifications(notifRes.data as NotificationItem[]);
      } catch (err) {
        console.error('Error fetching Supabase finance data:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // LocalStore fallback
      setExpenses(LocalStore.getExpenses(currentUserId));
      setBudgets(LocalStore.getBudgets(currentUserId));
      setCategoryBudgets(LocalStore.getCategoryBudgets(currentUserId));
      setIncomes(LocalStore.getIncomes(currentUserId));
      setSavingsGoals(LocalStore.getSavingsGoals(currentUserId));
      setSavingsContributions(LocalStore.getSavingsContributions(currentUserId));
      setNotifications(LocalStore.getNotifications(currentUserId));
      setNotificationPreferences(LocalStore.getNotificationPreferences());
      setLoading(false);
    }
  }, [user, currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current active budget for selected month and year
  const currentBudget = useMemo(() => {
    return budgets.find((b) => b.month === selectedMonth && b.year === selectedYear);
  }, [budgets, selectedMonth, selectedYear]);

  // Centralized financial summary calculation including incomes & daily allowance
  const summary = useMemo(() => {
    return calculateFinancialSummary(
      expenses,
      currentBudget?.amount,
      selectedMonth,
      selectedYear,
      incomes
    );
  }, [expenses, currentBudget, selectedMonth, selectedYear, incomes]);

  // Financial Health Score calculation
  const healthScore = useMemo(() => {
    return calculateFinancialHealthScore(summary, savingsGoals);
  }, [summary, savingsGoals]);

  // Smart Notification Engine: Evaluate thresholds and emit deduplicated alerts
  useEffect(() => {
    if (!user || loading) return;

    setNotifications((prev) => {
      const existingKeys = new Set(prev.map((n) => n.dedup_key || `${n.type}-${n.title}`));
      const newAlerts: NotificationItem[] = [];

      const pushAlert = (
        type: NotificationItem['type'],
        title: string,
        message: string,
        action_url: string,
        dedup_key: string
      ) => {
        if (existingKeys.has(dedup_key)) return;
        existingKeys.add(dedup_key);
        newAlerts.push({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          user_id: user.id,
          title,
          message,
          type,
          read: false,
          action_url,
          dedup_key,
          created_at: new Date().toISOString(),
        });
      };

      const periodKey = `${selectedYear}-${selectedMonth}`;

      // 1. 80% Budget Utilization Alert
      if (notificationPreferences.budget_alerts_enabled && summary.isNearBudgetLimit) {
        pushAlert(
          'budget_alert',
          '80% Monthly Budget Utilized',
          `You have used ${summary.budgetUsagePercentage}% of your ${getMonthName(selectedMonth)} budget (${formatINR(summary.remainingBudget)} remaining). Stick to ${formatINR(summary.dailyAllowance)}/day.`,
          '/budgets',
          `budget-80-${periodKey}`
        );
      }

      // 2. Budget Exceeded Alert
      if (notificationPreferences.budget_alerts_enabled && summary.isOverBudget) {
        pushAlert(
          'budget_alert',
          'Monthly Budget Exceeded',
          `Your ${getMonthName(selectedMonth)} expenses (${formatINR(summary.totalExpenses)}) have exceeded your ${formatINR(summary.monthlyBudget)} cap by ${formatINR(Math.abs(summary.remainingBudget))}.`,
          '/budgets',
          `budget-exceeded-${periodKey}`
        );
      }

      // 3. Unusual Expenditure Detection
      if (notificationPreferences.anomaly_alerts_enabled && expenses.length >= 3) {
        const anomalies = detectExpenseAnomalies(expenses).filter((a) => a.isAnomaly);
        if (anomalies.length > 0) {
          const topAnomaly = anomalies[0];
          pushAlert(
            'anomaly',
            `Unusual Spending Pattern: ${topAnomaly.title || topAnomaly.category}`,
            topAnomaly.explanation,
            '/insights',
            `anomaly-${topAnomaly.expenseId || topAnomaly.title}`
          );
        }
      }

      // 4. Savings Goal Milestones (50%, 75%, 100%)
      if (notificationPreferences.goal_alerts_enabled) {
        savingsGoals.forEach((goal) => {
          const pct = goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;
          if (pct >= 100) {
            pushAlert(
              'goal_milestone',
              `Goal Completed: ${goal.name}!`,
              `You reached 100% of your ${formatINR(goal.target_amount)} target for "${goal.name}".`,
              '/savings',
              `goal-100-${goal.id}`
            );
          } else if (pct >= 75) {
            pushAlert(
              'goal_milestone',
              `75% Savings Milestone: ${goal.name}`,
              `You are 75%+ of the way to "${goal.name}" (${formatINR(goal.current_amount)} saved).`,
              '/savings',
              `goal-75-${goal.id}`
            );
          }
        });
      }

      // 5. Monthly Financial Summary Ready
      if (notificationPreferences.monthly_summary_enabled && summary.transactionCount > 0) {
        pushAlert(
          'monthly_summary',
          `${getMonthName(selectedMonth)} AI Financial Summary Ready`,
          `Health Score: ${healthScore.overallScore}/100 (${healthScore.grade}). Top spend: ${summary.highestCategory?.category || 'N/A'}.`,
          '/',
          `summary-${periodKey}`
        );
      }

      if (newAlerts.length === 0) return prev;
      const updated = [...newAlerts, ...prev].slice(0, 30);
      LocalStore.saveNotifications(updated);
      return updated;
    });
  }, [
    user,
    loading,
    summary,
    expenses,
    savingsGoals,
    healthScore,
    selectedMonth,
    selectedYear,
    notificationPreferences,
  ]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Add Expense
  const addExpense = async (data: ExpenseInput): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    const newExpense: Expense = {
      id: `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: user.id,
      title: data.title.trim(),
      amount: Number(data.amount),
      category: data.category,
      subcategory: data.subcategory,
      category_confirmed: data.category_confirmed ?? true,
      is_recurring: data.is_recurring ?? false,
      expense_date: data.expense_date,
      payment_method: data.payment_method,
      notes: data.notes?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: inserted, error } = await supabase.from('expenses').insert(newExpense).select().single();
        if (error) return { success: false, error: error.message };
        setExpenses((prev) => [inserted as Expense, ...prev]);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    setExpenses((prev) => {
      const next = [newExpense, ...prev];
      LocalStore.saveExpenses(next);
      return next;
    });
    return { success: true };
  };

  // Update Expense
  const updateExpense = async (id: string, data: Partial<ExpenseInput>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    if (isSupabaseConfigured) {
      try {
        const { data: updated, error } = await supabase
          .from('expenses')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) return { success: false, error: error.message };
        setExpenses((prev) => prev.map((e) => (e.id === id ? (updated as Expense) : e)));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    setExpenses((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...data, updated_at: new Date().toISOString() } : e));
      LocalStore.saveExpenses(next);
      return next;
    });
    return { success: true };
  };

  // Delete Expense
  const deleteExpense = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: error.message };
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      LocalStore.saveExpenses(next);
      return next;
    });
    return { success: true };
  };

  // Set Monthly Budget
  const setMonthlyBudget = async (
    amount: number,
    month?: number,
    year?: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    const m = month || selectedMonth;
    const y = year || selectedYear;
    const safeAmount = Math.max(0, Number(amount));

    if (isSupabaseConfigured) {
      try {
        const { data: upserted, error } = await supabase
          .from('monthly_budgets')
          .upsert(
            {
              user_id: user.id,
              month: m,
              year: y,
              amount: safeAmount,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,month,year' }
          )
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        setBudgets((prev) => {
          const existingIdx = prev.findIndex((b) => b.month === m && b.year === y);
          if (existingIdx >= 0) {
            const next = [...prev];
            next[existingIdx] = upserted as MonthlyBudget;
            return next;
          }
          return [...prev, upserted as MonthlyBudget];
        });
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    setBudgets((prev) => {
      const existingIdx = prev.findIndex((b) => b.month === m && b.year === y);
      let next: MonthlyBudget[];
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          amount: safeAmount,
          updated_at: new Date().toISOString(),
        };
      } else {
        const newBudget: MonthlyBudget = {
          id: `b-${y}-${m}`,
          user_id: user.id,
          month: m,
          year: y,
          amount: safeAmount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        next = [...prev, newBudget];
      }
      LocalStore.saveBudgets(next);
      return next;
    });

    return { success: true };
  };

  // Set Category Budget / Recommendation Decision
  const setCategoryBudget = async (
    category: ExpenseCategory,
    amount: number,
    status: 'accepted' | 'rejected' | 'customized' = 'accepted',
    recommendedAmount?: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    const safeAmount = Math.max(0, Number(amount));

    setCategoryBudgets((prev) => {
      const existingIdx = prev.findIndex(
        (b) => b.category === category && b.month === selectedMonth && b.year === selectedYear
      );
      let next: CategoryBudget[];
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          allocated_amount: safeAmount,
          recommended_amount: recommendedAmount ?? next[existingIdx].recommended_amount,
          recommendation_status: status,
          updated_at: new Date().toISOString(),
        };
      } else {
        const item: CategoryBudget = {
          id: `cb-${selectedYear}-${selectedMonth}-${category}`,
          user_id: user.id,
          category,
          month: selectedMonth,
          year: selectedYear,
          allocated_amount: safeAmount,
          recommended_amount: recommendedAmount ?? safeAmount,
          recommendation_status: status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        next = [...prev, item];
      }
      LocalStore.saveCategoryBudgets(next);
      return next;
    });

    return { success: true };
  };

  // Incomes CRUD
  const addIncome = async (data: IncomeInput): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    const newIncome: Income = {
      id: `inc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: user.id,
      source: data.source.trim(),
      amount: Number(data.amount),
      income_date: data.income_date,
      recurrence: data.recurrence || 'one_time',
      notes: data.notes?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: inserted, error } = await supabase.from('incomes').insert(newIncome).select().single();
        if (error) return { success: false, error: error.message };
        setIncomes((prev) => [inserted as Income, ...prev]);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    setIncomes((prev) => {
      const next = [newIncome, ...prev];
      LocalStore.saveIncomes(next);
      return next;
    });
    return { success: true };
  };

  const deleteIncome = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('incomes').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: error.message };
        setIncomes((prev) => prev.filter((i) => i.id !== id));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    setIncomes((prev) => {
      const next = prev.filter((i) => i.id !== id);
      LocalStore.saveIncomes(next);
      return next;
    });
    return { success: true };
  };

  // Savings Goals CRUD
  const addSavingsGoal = async (data: SavingsGoalInput): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    const newGoal: SavingsGoal = {
      id: `goal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: user.id,
      name: data.name.trim(),
      target_amount: Number(data.target_amount),
      current_amount: 0,
      planned_amount: 0,
      target_date: data.target_date,
      category: data.category || 'General',
      status: 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: inserted, error } = await supabase.from('savings_goals').insert(newGoal).select().single();
        if (error) return { success: false, error: error.message };
        setSavingsGoals((prev) => [...prev, inserted as SavingsGoal]);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    setSavingsGoals((prev) => {
      const next = [...prev, newGoal];
      LocalStore.saveSavingsGoals(next);
      return next;
    });
    return { success: true };
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    if (isSupabaseConfigured) {
      try {
        const { data: updated, error } = await supabase
          .from('savings_goals')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) return { success: false, error: error.message };
        setSavingsGoals((prev) => prev.map((g) => (g.id === id ? (updated as SavingsGoal) : g)));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    setSavingsGoals((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g));
      LocalStore.saveSavingsGoals(next);
      return next;
    });
    return { success: true };
  };

  const deleteSavingsGoal = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', user.id);
        if (error) return { success: false, error: error.message };
        setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    setSavingsGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      LocalStore.saveSavingsGoals(next);
      return next;
    });
    return { success: true };
  };

  /**
   * Records a savings contribution while keeping Planned Contributions strictly separate
   * from Verified Actual Deposits.
   */
  const addSavingsContribution = async (
    goalId: string,
    amount: number,
    notes?: string,
    contributionType: 'verified_deposit' | 'planned' = 'verified_deposit'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User is not authenticated' };
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return { success: false, error: 'Savings goal not found' };

    const safeAmt = Math.max(0, Number(amount));
    const isVerified = contributionType === 'verified_deposit';

    const newContrib: SavingsContribution = {
      id: `contrib-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      goal_id: goalId,
      user_id: user.id,
      amount: safeAmt,
      contribution_type: contributionType,
      is_verified: isVerified,
      contribution_date: new Date().toISOString().split('T')[0],
      notes: notes?.trim() || (isVerified ? 'Verified deposit' : 'Planned contribution'),
      created_at: new Date().toISOString(),
    };

    setSavingsContributions((prev) => {
      const next = [newContrib, ...prev];
      LocalStore.saveSavingsContributions(next);
      return next;
    });

    if (isVerified) {
      const newAmount = Math.max(0, goal.current_amount + safeAmt);
      const newStatus = newAmount >= goal.target_amount ? 'completed' : goal.status;
      return updateSavingsGoal(goalId, { current_amount: newAmount, status: newStatus });
    } else {
      const newPlanned = Math.max(0, (goal.planned_amount || 0) + safeAmt);
      return updateSavingsGoal(goalId, { planned_amount: newPlanned });
    }
  };

  /**
   * Converts a planned contribution into a verified actual deposit.
   */
  const verifyPlannedContribution = async (
    contributionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const contrib = savingsContributions.find((c) => c.id === contributionId);
    if (!contrib || contrib.is_verified) {
      return { success: false, error: 'Contribution not found or already verified' };
    }

    const goal = savingsGoals.find((g) => g.id === contrib.goal_id);
    if (!goal) return { success: false, error: 'Goal not found' };

    setSavingsContributions((prev) => {
      const next = prev.map((c) =>
        c.id === contributionId
          ? { ...c, contribution_type: 'verified_deposit' as const, is_verified: true }
          : c
      );
      LocalStore.saveSavingsContributions(next);
      return next;
    });

    const newVerifiedAmount = goal.current_amount + contrib.amount;
    const newPlannedAmount = Math.max(0, (goal.planned_amount || 0) - contrib.amount);
    const newStatus = newVerifiedAmount >= goal.target_amount ? 'completed' : goal.status;

    return updateSavingsGoal(goal.id, {
      current_amount: newVerifiedAmount,
      planned_amount: newPlannedAmount,
      status: newStatus,
    });
  };

  // Notification methods
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      LocalStore.saveNotifications(next);
      return next;
    });
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      LocalStore.saveNotifications(next);
      return next;
    });
  };

  const updateNotificationPreferences = (updates: Partial<NotificationPreferences>) => {
    setNotificationPreferences((prev) => {
      const next = { ...prev, ...updates };
      LocalStore.saveNotificationPreferences(next);
      return next;
    });
  };

  return (
    <FinanceContext.Provider
      value={{
        expenses,
        budgets,
        categoryBudgets,
        incomes,
        savingsGoals,
        savingsContributions,
        notifications,
        notificationPreferences,
        unreadNotificationCount,
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        summary,
        healthScore,
        currentBudget,
        loading,
        addExpense,
        updateExpense,
        deleteExpense,
        setMonthlyBudget,
        setCategoryBudget,
        addIncome,
        deleteIncome,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        addSavingsContribution,
        verifyPlannedContribution,
        markNotificationRead,
        clearAllNotifications,
        updateNotificationPreferences,
        refreshData: loadData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
