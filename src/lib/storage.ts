import {
  Expense,
  MonthlyBudget,
  CategoryBudget,
  Income,
  SavingsGoal,
  SavingsContribution,
  NotificationItem,
  NotificationPreferences,
} from '@/types/finance';
import { CookiePreferences, PrivacyRequest } from '@/types/privacy';

const STORAGE_KEYS = {
  USER: 'smartpaisa_user',
  PROFILE: 'smartpaisa_profile',
  EXPENSES: 'smartpaisa_expenses',
  BUDGETS: 'smartpaisa_budgets',
  CATEGORY_BUDGETS: 'smartpaisa_category_budgets',
  INCOMES: 'smartpaisa_incomes',
  SAVINGS_GOALS: 'smartpaisa_savings_goals',
  SAVINGS_CONTRIBUTIONS: 'smartpaisa_savings_contributions',
  NOTIFICATIONS: 'smartpaisa_notifications',
  NOTIFICATION_PREFS: 'smartpaisa_notification_prefs',
  COOKIES: 'smartpaisa_cookie_consent',
  PRIVACY_REQUESTS: 'smartpaisa_privacy_requests',
  AI_CHAT: 'smartpaisa_ai_chat',
};

// Realistic seed expenses tailored for Indian college students / young adults
export const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp-101',
    user_id: 'user-demo-1',
    title: 'Semester Exam Books & Stationery',
    amount: 1450,
    category: 'Education',
    subcategory: 'Books & Courseware',
    category_confirmed: true,
    expense_date: '2026-11-01',
    payment_method: 'UPI',
    notes: 'Engineering textbook set from college bookstore',
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 'exp-102',
    user_id: 'user-demo-1',
    title: 'Metro SmartCard Monthly Recharge',
    amount: 800,
    category: 'Transport',
    subcategory: 'Public Commute & Travel',
    category_confirmed: true,
    is_recurring: true,
    expense_date: '2026-11-01',
    payment_method: 'UPI',
    notes: 'Daily commute between PG and University campus',
    created_at: '2026-11-01T11:30:00Z',
    updated_at: '2026-11-01T11:30:00Z',
  },
  {
    id: 'exp-103',
    user_id: 'user-demo-1',
    title: 'Hostel Canteen Lunch & Chai',
    amount: 180,
    category: 'Food & Dining',
    subcategory: 'Campus & Local Dining',
    category_confirmed: true,
    expense_date: '2026-11-02',
    payment_method: 'Cash',
    notes: 'Thali meal with batchmates',
    created_at: '2026-11-02T13:15:00Z',
    updated_at: '2026-11-02T13:15:00Z',
  },
  {
    id: 'exp-104',
    user_id: 'user-demo-1',
    title: 'Jio 5G Quarterly Recharge',
    amount: 749,
    category: 'Bills & Recharge',
    subcategory: 'Mobile, Utilities & Internet',
    category_confirmed: true,
    is_recurring: true,
    expense_date: '2026-10-28',
    payment_method: 'UPI',
    notes: 'High speed mobile data for study & projects',
    created_at: '2026-10-28T09:00:00Z',
    updated_at: '2026-10-28T09:00:00Z',
  },
  {
    id: 'exp-105',
    user_id: 'user-demo-1',
    title: 'Weekend Movie & Popcorn',
    amount: 520,
    category: 'Entertainment',
    subcategory: 'OTT, Music & Movies',
    category_confirmed: true,
    expense_date: '2026-10-26',
    payment_method: 'Debit Card',
    notes: 'PVR cinema ticket with hostel friends',
    created_at: '2026-10-26T18:45:00Z',
    updated_at: '2026-10-26T18:45:00Z',
  },
  {
    id: 'exp-106',
    user_id: 'user-demo-1',
    title: 'Swiggy Dinner Delivery',
    amount: 340,
    category: 'Food & Dining',
    subcategory: 'Food Delivery',
    category_confirmed: true,
    expense_date: '2026-10-24',
    payment_method: 'UPI',
    notes: 'Late night study group snacks',
    created_at: '2026-10-24T22:10:00Z',
    updated_at: '2026-10-24T22:10:00Z',
  },
  {
    id: 'exp-107',
    user_id: 'user-demo-1',
    title: 'Pharmacy Vitamins & Bandages',
    amount: 290,
    category: 'Health',
    subcategory: 'Medicines & Consultations',
    category_confirmed: true,
    expense_date: '2026-10-20',
    payment_method: 'UPI',
    notes: 'First aid box refills',
    created_at: '2026-10-20T16:00:00Z',
    updated_at: '2026-10-20T16:00:00Z',
  },
  {
    id: 'exp-108',
    user_id: 'user-demo-1',
    title: 'Campus Haircut & Grooming',
    amount: 250,
    category: 'Personal Care',
    subcategory: 'Fitness & Grooming',
    category_confirmed: true,
    expense_date: '2026-10-15',
    payment_method: 'Cash',
    notes: 'Monthly haircut',
    created_at: '2026-10-15T11:00:00Z',
    updated_at: '2026-10-15T11:00:00Z',
  },
  {
    id: 'exp-109',
    user_id: 'user-demo-1',
    title: 'New College Backpack',
    amount: 1199,
    category: 'Shopping',
    subcategory: 'E-commerce & Retail',
    category_confirmed: true,
    expense_date: '2026-10-10',
    payment_method: 'Credit Card',
    notes: 'Waterproof laptop bag for rainy season',
    created_at: '2026-10-10T14:20:00Z',
    updated_at: '2026-10-10T14:20:00Z',
  },
];

export const SEED_BUDGETS: MonthlyBudget[] = [
  {
    id: 'b-2026-11',
    user_id: 'user-demo-1',
    month: 11,
    year: 2026,
    amount: 12000,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
  {
    id: 'b-2026-10',
    user_id: 'user-demo-1',
    month: 10,
    year: 2026,
    amount: 11500,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'b-2026-09',
    user_id: 'user-demo-1',
    month: 9,
    year: 2026,
    amount: 11000,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
];

export const SEED_INCOMES: Income[] = [
  {
    id: 'inc-101',
    user_id: 'user-demo-1',
    source: 'Freelance UI/Web Design Gig',
    amount: 8500,
    income_date: '2026-11-01',
    recurrence: 'freelance',
    notes: 'Payment for landing page redesign project',
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 'inc-102',
    user_id: 'user-demo-1',
    source: 'University Research Assistant Stipend',
    amount: 6000,
    income_date: '2026-11-02',
    recurrence: 'monthly',
    notes: 'Department research allowance for computer vision lab',
    created_at: '2026-11-02T12:00:00Z',
    updated_at: '2026-11-02T12:00:00Z',
  },
];

export const SEED_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-201',
    user_id: 'user-demo-1',
    name: 'New Laptop for AI/ML Projects',
    target_amount: 65000,
    current_amount: 28000,
    planned_amount: 5000,
    target_date: '2027-02-28',
    category: 'Technology',
    status: 'in_progress',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
  {
    id: 'goal-202',
    user_id: 'user-demo-1',
    name: 'Semester Emergency Contingency Fund',
    target_amount: 10000,
    current_amount: 6500,
    planned_amount: 1500,
    target_date: '2026-12-31',
    category: 'Emergency',
    status: 'in_progress',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
  },
  {
    id: 'goal-203',
    user_id: 'user-demo-1',
    name: 'Inter-College Hackathon Travel Fund',
    target_amount: 8000,
    current_amount: 8000,
    planned_amount: 0,
    target_date: '2026-10-15',
    category: 'Travel',
    status: 'completed',
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-10-15T00:00:00Z',
  },
];

export const SEED_CONTRIBUTIONS: SavingsContribution[] = [
  {
    id: 'contrib-1',
    goal_id: 'goal-201',
    user_id: 'user-demo-1',
    amount: 15000,
    contribution_type: 'verified_deposit',
    is_verified: true,
    contribution_date: '2026-09-15',
    notes: 'Summer internship stipend deposit',
    created_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'contrib-2',
    goal_id: 'goal-201',
    user_id: 'user-demo-1',
    amount: 13000,
    contribution_type: 'verified_deposit',
    is_verified: true,
    contribution_date: '2026-10-20',
    notes: 'Freelance project payout',
    created_at: '2026-10-20T14:00:00Z',
  },
  {
    id: 'contrib-3',
    goal_id: 'goal-201',
    user_id: 'user-demo-1',
    amount: 5000,
    contribution_type: 'planned',
    is_verified: false,
    contribution_date: '2026-11-15',
    notes: 'Planned mid-month transfer from stipend',
    created_at: '2026-11-01T09:00:00Z',
  },
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    user_id: 'user-demo-1',
    title: 'Daily Allowance Recommendation',
    message: 'To maintain your November budget target, your recommended safe spending limit is ₹350/day.',
    type: 'system',
    read: false,
    action_url: '/',
    dedup_key: 'daily-allowance-2026-11',
    created_at: '2026-11-03T09:00:00Z',
  },
  {
    id: 'notif-2',
    user_id: 'user-demo-1',
    title: 'Savings Goal Milestone Achieved',
    message: 'Congratulations! You reached 43% of your "New Laptop for AI/ML Projects" goal (₹28,000 verified saved).',
    type: 'goal_milestone',
    read: false,
    action_url: '/savings',
    dedup_key: 'goal-201-40pct',
    created_at: '2026-11-02T14:30:00Z',
  },
  {
    id: 'notif-3',
    user_id: 'user-demo-1',
    title: 'Upcoming Recurring Expense Detected',
    message: 'Metro SmartCard Monthly Recharge (₹800) and Jio 5G Recharge are tracked as recurring commitments.',
    type: 'recurring_payment',
    read: false,
    action_url: '/predictions',
    dedup_key: 'recurring-2026-11',
    created_at: '2026-11-01T18:00:00Z',
  },
];

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  budget_alerts_enabled: true,
  anomaly_alerts_enabled: true,
  goal_alerts_enabled: true,
  forecast_alerts_enabled: true,
  recurring_alerts_enabled: true,
  monthly_summary_enabled: true,
};

export const LocalStore = {
  getExpenses(userId: string): Expense[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
        return SEED_EXPENSES.filter((e) => e.user_id === userId);
      }
      const parsed: Expense[] = JSON.parse(data);
      return parsed.filter((e) => e.user_id === userId);
    } catch {
      return [];
    }
  },

  saveExpenses(expenses: Expense[]): void {
    try {
      const existing: Expense[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
      const userId = expenses[0]?.user_id;
      const others = userId ? existing.filter((e) => e.user_id !== userId) : [];
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([...expenses, ...others]));
    } catch {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    }
  },

  getBudgets(userId: string): MonthlyBudget[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(SEED_BUDGETS));
        return SEED_BUDGETS.filter((b) => b.user_id === userId);
      }
      const parsed: MonthlyBudget[] = JSON.parse(data);
      return parsed.filter((b) => b.user_id === userId);
    } catch {
      return [];
    }
  },

  saveBudgets(budgets: MonthlyBudget[]): void {
    try {
      const existing: MonthlyBudget[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS) || '[]');
      const userId = budgets[0]?.user_id;
      const others = userId ? existing.filter((b) => b.user_id !== userId) : [];
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify([...budgets, ...others]));
    } catch {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    }
  },

  getCategoryBudgets(userId: string): CategoryBudget[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORY_BUDGETS);
      if (!data) return [];
      const parsed: CategoryBudget[] = JSON.parse(data);
      return parsed.filter((b) => b.user_id === userId);
    } catch {
      return [];
    }
  },

  saveCategoryBudgets(budgets: CategoryBudget[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(budgets));
  },

  getIncomes(userId: string): Income[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INCOMES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(SEED_INCOMES));
        return SEED_INCOMES.filter((i) => i.user_id === userId);
      }
      const parsed: Income[] = JSON.parse(data);
      return parsed.filter((i) => i.user_id === userId);
    } catch {
      return [];
    }
  },

  saveIncomes(incomes: Income[]): void {
    try {
      const existing: Income[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.INCOMES) || '[]');
      const userId = incomes[0]?.user_id;
      const others = userId ? existing.filter((i) => i.user_id !== userId) : [];
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify([...incomes, ...others]));
    } catch {
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
    }
  },

  getSavingsGoals(userId: string): SavingsGoal[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(SEED_SAVINGS_GOALS));
        return SEED_SAVINGS_GOALS.filter((g) => g.user_id === userId);
      }
      const parsed: SavingsGoal[] = JSON.parse(data);
      return parsed.filter((g) => g.user_id === userId);
    } catch {
      return [];
    }
  },

  saveSavingsGoals(goals: SavingsGoal[]): void {
    try {
      const existing: SavingsGoal[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS) || '[]');
      const userId = goals[0]?.user_id;
      const others = userId ? existing.filter((g) => g.user_id !== userId) : [];
      localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify([...goals, ...others]));
    } catch {
      localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(goals));
    }
  },

  getSavingsContributions(userId: string): SavingsContribution[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVINGS_CONTRIBUTIONS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SAVINGS_CONTRIBUTIONS, JSON.stringify(SEED_CONTRIBUTIONS));
        return SEED_CONTRIBUTIONS.filter((c) => c.user_id === userId);
      }
      const parsed: SavingsContribution[] = JSON.parse(data);
      return parsed.filter((c) => c.user_id === userId);
    } catch {
      return [];
    }
  },

  saveSavingsContributions(contributions: SavingsContribution[]): void {
    localStorage.setItem(STORAGE_KEYS.SAVINGS_CONTRIBUTIONS, JSON.stringify(contributions));
  },

  getNotifications(userId: string): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
        return SEED_NOTIFICATIONS;
      }
      const parsed: NotificationItem[] = JSON.parse(data);
      return parsed.filter((n) => n.user_id === userId);
    } catch {
      return SEED_NOTIFICATIONS;
    }
  },

  saveNotifications(notifications: NotificationItem[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  getNotificationPreferences(): NotificationPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFS);
      return data ? { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(data) } : DEFAULT_NOTIFICATION_PREFS;
    } catch {
      return DEFAULT_NOTIFICATION_PREFS;
    }
  },

  saveNotificationPreferences(prefs: NotificationPreferences): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(prefs));
  },

  getCookiePreferences(): CookiePreferences | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COOKIES);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveCookiePreferences(prefs: CookiePreferences): void {
    localStorage.setItem(STORAGE_KEYS.COOKIES, JSON.stringify(prefs));
  },

  getPrivacyRequests(userId: string): PrivacyRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRIVACY_REQUESTS);
      const parsed: PrivacyRequest[] = data ? JSON.parse(data) : [];
      return parsed.filter((r) => r.user_id === userId);
    } catch {
      return [];
    }
  },

  savePrivacyRequests(requests: PrivacyRequest[]): void {
    localStorage.setItem(STORAGE_KEYS.PRIVACY_REQUESTS, JSON.stringify(requests));
  },

  clearAllUserData(userId: string): void {
    const allExp: Expense[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
    const filteredExp = allExp.filter((e) => e.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filteredExp));

    const allBudgets: MonthlyBudget[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS) || '[]');
    const filteredBudgets = allBudgets.filter((b) => b.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(filteredBudgets));

    const allCatBudgets: CategoryBudget[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORY_BUDGETS) || '[]');
    localStorage.setItem(STORAGE_KEYS.CATEGORY_BUDGETS, JSON.stringify(allCatBudgets.filter((b) => b.user_id !== userId)));

    const allIncomes: Income[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.INCOMES) || '[]');
    const filteredIncomes = allIncomes.filter((i) => i.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(filteredIncomes));

    const allGoals: SavingsGoal[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS) || '[]');
    const filteredGoals = allGoals.filter((g) => g.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(filteredGoals));

    const allContribs: SavingsContribution[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS_CONTRIBUTIONS) || '[]');
    localStorage.setItem(STORAGE_KEYS.SAVINGS_CONTRIBUTIONS, JSON.stringify(allContribs.filter((c) => c.user_id !== userId)));

    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AI_CHAT);
  },
};
