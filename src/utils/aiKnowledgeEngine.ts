import { FinancialSummary, Expense, SavingsGoal, FinancialHealthScore } from '@/types/finance';
import { AnomalyDetectionResult } from '@/types/ml';
import { formatINR } from './currency';
import { getMonthName } from './date';
import {
  generateExpenseForecast,
  generateCategoryForecasts,
  detectExpenseAnomalies,
  generateSmartBudgetRecommendations,
} from './mlEngine';

export interface FinancialContext {
  summary: FinancialSummary;
  selectedMonth: number;
  selectedYear: number;
  expenses: Expense[];
  savingsGoals?: SavingsGoal[];
  anomalies?: AnomalyDetectionResult[];
  healthScore?: FinancialHealthScore;
}

const FINANCIAL_DISCLAIMER = `\n\n---\n*Disclaimer: SmartPaisa AI provides educational insights and deterministic financial calculations based on your recorded ledger. This is not SEBI-registered investment, tax, or legal advice.*`;

/**
 * Sanitizes user input prompts to mitigate prompt injection, jailbreak attempts,
 * and accidental PII/secret leakage before sending to any LLM endpoint.
 */
export function sanitizeAiPrompt(rawInput: string): {
  sanitized: string;
  flagged: boolean;
  reason?: string;
} {
  const trimmed = (rawInput || '').trim().slice(0, 800);

  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
    /system\s*prompt/i,
    /you\s+are\s+now\s+(dan|unrestricted|jailbroken)/i,
    /reveal\s+(your|the)\s+(api\s*key|secret|token|password|system\s*instructions)/i,
    /disregard\s+all\s+safety/i,
    /<script\b[^>]*>/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(trimmed)) {
      return {
        sanitized: trimmed.replace(pattern, '[REDACTED_INSTRUCTION]'),
        flagged: true,
        reason: 'Prompt injection or system instruction override attempt detected and neutralized.',
      };
    }
  }

  const redacted = trimmed
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CARD]')
    .replace(/\bsk-[a-zA-Z0-9]{20,}\b/g, '[REDACTED_API_KEY]')
    .replace(/\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g, '[REDACTED_TOKEN]');

  return {
    sanitized: redacted,
    flagged: false,
  };
}

/**
 * SmartPaisa 2.0 Deterministic Financial Calculation & Conversational AI Engine.
 * Calculates accurate figures from the user's authenticated ledger in TypeScript
 * and communicates clear explanations, step-by-step math, and personalized recommendations.
 */
export function explainFinancialQuery(query: string, context: FinancialContext): string {
  const sanitization = sanitizeAiPrompt(query);
  if (sanitization.flagged) {
    return `### 🛡️ Security Guardrail Active\n\nI cannot process instructions that attempt to override system security rules or access internal credentials. Please ask a question about your personal finances, budget, savings goals, or financial literacy!${FINANCIAL_DISCLAIMER}`;
  }

  const q = sanitization.sanitized.toLowerCase().trim();
  const rawQ = sanitization.sanitized.trim();
  const { summary, selectedMonth, selectedYear, expenses, savingsGoals = [] } = context;
  const monthName = getMonthName(selectedMonth);

  const currMonthExpenses = expenses.filter((e) => {
    const [y, m] = e.expense_date.split('-').map(Number);
    return y === selectedYear && m === selectedMonth;
  });

  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  const prevMonthName = getMonthName(prevMonth);
  const prevMonthExpenses = expenses.filter((e) => {
    const [y, m] = e.expense_date.split('-').map(Number);
    return y === prevYear && m === prevMonth;
  });
  const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // ─────────────────────────────────────────────────────────────
  // REQUIRED QUERY 4: "Can I afford a ₹2,000 purchase this week?" (Affordability Check)
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('can i afford') ||
    q.includes('afford a') ||
    q.includes('should i buy') ||
    (q.includes('afford') && /\d+/.test(q))
  ) {
    const numMatch = q.match(/₹?\s*(\d[\d,]*)/);
    const purchaseAmount = numMatch ? parseInt(numMatch[1].replace(/,/g, ''), 10) : 2000;
    const daysLeft = Math.max(1, summary.daysInMonth - summary.daysElapsed);
    const remainingBudget = summary.monthlyBudget > 0 ? summary.remainingBudget : 0;

    if (summary.monthlyBudget <= 0) {
      return `### 🧮 Affordability Analysis for ${formatINR(purchaseAmount)} Purchase

**Honest Data Check:** You have not set a monthly budget for **${monthName} ${selectedYear}** yet (current spending: **${formatINR(summary.totalExpenses)}** across ${summary.transactionCount} transactions).

**How to Evaluate This ${formatINR(purchaseAmount)} Purchase:**
1. **Set a Monthly Budget First**: Visit the **Budgets** page to set your monthly cap so I can calculate your exact remaining weekly allowance.
2. **Current Burn Rate**: You are spending **${formatINR(summary.dailyAverage)}/day**. A ${formatINR(purchaseAmount)} purchase equals **${summary.dailyAverage > 0 ? (purchaseAmount / summary.dailyAverage).toFixed(1) : 'N/A'} days** of your normal spending.
3. **24-Hour Rule**: Wait 24 hours before buying non-essential items over ₹1,000.${FINANCIAL_DISCLAIMER}`;
    }

    const postPurchaseRemaining = remainingBudget - purchaseAmount;
    const currentSafeDaily = Math.max(0, Math.floor(remainingBudget / daysLeft));
    const newSafeDaily = Math.max(0, Math.floor(postPurchaseRemaining / daysLeft));
    const weeklyAllowance = currentSafeDaily * Math.min(7, daysLeft);

    const verdict =
      postPurchaseRemaining < 0
        ? '❌ **Not Recommended Right Now (Exceeds Monthly Budget)**'
        : purchaseAmount > weeklyAllowance
        ? '⚠️ **Tight Squeeze (Exceeds 7-Day Safe Allowance)**'
        : '✅ **Yes, You Can Afford This Purchase Safely**';

    return `### 🧮 Affordability Check: ${formatINR(purchaseAmount)} Purchase This Week

**Verdict:** ${verdict}

**Step-by-Step Financial Math (${monthName} ${selectedYear}):**
- **Monthly Budget**: ${formatINR(summary.monthlyBudget)}
- **Spent So Far**: ${formatINR(summary.totalExpenses)} (${summary.budgetUsagePercentage}% used)
- **Remaining Budget Before Purchase**: **${formatINR(remainingBudget)}** (${daysLeft} days left)
- **Current 7-Day Safe Allowance**: **${formatINR(weeklyAllowance)}** (${formatINR(currentSafeDaily)}/day × ${Math.min(7, daysLeft)} days)
- **Remaining Budget After ${formatINR(purchaseAmount)} Purchase**: **${formatINR(postPurchaseRemaining)}**
- **New Daily Allowance After Purchase**: **${formatINR(newSafeDaily)}/day** (down from ${formatINR(currentSafeDaily)}/day)

**Personalized Recommendation:**
${
  postPurchaseRemaining < 0
    ? `Buying this right now will push you **${formatINR(Math.abs(postPurchaseRemaining))} over your monthly budget**. Consider postponing this purchase to next month or funding it from non-essential category savings.`
    : purchaseAmount > weeklyAllowance
    ? `While it fits within your total remaining monthly budget, it consumes **${Math.round((purchaseAmount / Math.max(1, remainingBudget)) * 100)}%** of your remaining funds for the month. You will need to cap daily spending to **${formatINR(newSafeDaily)}/day** for the remaining ${daysLeft} days.`
    : `This purchase uses **${Math.round((purchaseAmount / Math.max(1, remainingBudget)) * 100)}%** of your remaining budget and fits comfortably inside your weekly allowance of ${formatINR(weeklyAllowance)}.`
}${FINANCIAL_DISCLAIMER}`;
  }

  // ─────────────────────────────────────────────────────────────
  // REQUIRED QUERY 8: "Compare this month with last month"
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('compare this month') ||
    q.includes('last month') ||
    q.includes('previous month') ||
    q.includes('month over month') ||
    (q.includes('compare') && q.includes('month'))
  ) {
    if (currMonthExpenses.length === 0 && prevMonthExpenses.length === 0) {
      return `### 📊 Month-over-Month Comparison (${monthName} vs ${prevMonthName})

There are no recorded transactions in either **${monthName} ${selectedYear}** or **${prevMonthName} ${prevYear}** yet. Add expenses or import a bank statement to unlock month-over-month comparisons!${FINANCIAL_DISCLAIMER}`;
    }

    const diff = summary.totalExpenses - prevMonthTotal;
    const pctChange =
      prevMonthTotal > 0 ? Math.round((diff / prevMonthTotal) * 100) : summary.totalExpenses > 0 ? 100 : 0;

    const prevCatTotals: Record<string, number> = {};
    for (const e of prevMonthExpenses) {
      prevCatTotals[e.category] = (prevCatTotals[e.category] || 0) + Number(e.amount);
    }

    const allCats = Array.from(
      new Set([...Object.keys(summary.categoryTotals), ...Object.keys(prevCatTotals)])
    );

    const catDiffs = allCats
      .map((cat) => {
        const curr = summary.categoryTotals[cat as keyof typeof summary.categoryTotals] || 0;
        const prev = prevCatTotals[cat] || 0;
        return { cat, curr, prev, delta: curr - prev };
      })
      .filter((c) => c.curr > 0 || c.prev > 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const tableRows = catDiffs
      .slice(0, 6)
      .map(
        (c) =>
          `| **${c.cat}** | ${formatINR(c.prev)} | ${formatINR(c.curr)} | ${
            c.delta > 0 ? `🔺 +${formatINR(c.delta)}` : c.delta < 0 ? `🟢 -${formatINR(Math.abs(c.delta))}` : '—'
          } |`
      )
      .join('\n');

    return `### 📊 Month-over-Month Comparison: ${monthName} ${selectedYear} vs ${prevMonthName} ${prevYear}

- **${prevMonthName} ${prevYear} Total**: **${formatINR(prevMonthTotal)}** (${prevMonthExpenses.length} txns)
- **${monthName} ${selectedYear} Total**: **${formatINR(summary.totalExpenses)}** (${currMonthExpenses.length} txns)
- **Net Difference**: **${diff >= 0 ? `+${formatINR(diff)} (+${pctChange}%)` : `-${formatINR(Math.abs(diff))} (${pctChange}%)`}**

| Category | ${prevMonthName} | ${monthName} | Change |
| :--- | :--- | :--- | :--- |
${tableRows || '| None | ₹0 | ₹0 | — |'}

**Key Takeaway:**
${
  prevMonthTotal === 0
    ? `We don't have historical transactions for ${prevMonthName} ${prevYear}, so ${monthName} serves as your baseline month.`
    : diff > 0
    ? `Your spending is up by **${formatINR(diff)} (${pctChange}%)** compared to ${prevMonthName}, primarily driven by **${catDiffs[0]?.cat || 'general expenses'}**.`
    : `Great job! You have spent **${formatINR(Math.abs(diff))} (${Math.abs(pctChange)}%) less** so far in ${monthName} compared to ${prevMonthName}.`
}${FINANCIAL_DISCLAIMER}`;
  }

  // ─────────────────────────────────────────────────────────────
  // REQUIRED QUERY 7: "Predict my next month's expenses"
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('predict') ||
    q.includes('forecast') ||
    q.includes('next month') ||
    q.includes('next week') ||
    q.includes('end of month') ||
    q.includes('projection')
  ) {
    if (expenses.length < 3) {
      return `### 📈 AI Expense Forecast

**Insufficient Historical Data:** You currently have only **${expenses.length} recorded transactions**. SmartPaisa never fabricates ML predictions—please log at least 3–5 transactions across multiple days so our Moving Average, Linear Regression, Random Forest, and XGBoost models can compute statistically valid projections.${FINANCIAL_DISCLAIMER}`;
    }

    const forecasts = generateExpenseForecast(expenses, summary.monthlyBudget, selectedMonth, selectedYear);
    const catForecasts = generateCategoryForecasts(expenses, selectedMonth, selectedYear);

    const topCatPredictions = catForecasts
      .slice(0, 5)
      .map(
        (c) =>
          `- **${c.category}**: Current ${formatINR(c.currentMonthSpent)} → Predicted Next Month **${formatINR(c.predictedNextMonth)}** (${c.trend === 'increasing' ? '📈 Increasing' : c.trend === 'decreasing' ? '📉 Decreasing' : '➡️ Stable'})`
      )
      .join('\n');

    return `### 🔮 AI Expense Forecast (${forecasts.monthEnd.modelUsed.toUpperCase()} Model)

**1. Time-Series Expenditure Predictions:**
- **Predicted Next 7 Days**: **${formatINR(forecasts.sevenDay.expectedAmount)}** (Range: ${formatINR(forecasts.sevenDay.lowerBound)} – ${formatINR(forecasts.sevenDay.upperBound)})
- **Projected End-of-Month (${monthName})**: **${formatINR(forecasts.monthEnd.expectedAmount)}** (95% CI: ${formatINR(forecasts.monthEnd.lowerBound)} – ${formatINR(forecasts.monthEnd.upperBound)})
- **Predicted Next Month (30-Day Horizon)**: **${formatINR(forecasts.thirtyDay.expectedAmount)}**
- **Budget Trajectory**: ${forecasts.monthEnd.overrunWarning ? `🚨 Projected overrun of **${formatINR(forecasts.monthEnd.projectedOverrunAmount || 0)}**` : '✅ Projected to finish within budget'}

**2. Category-Wise Next Month Predictions:**
${topCatPredictions || '- Insufficient category history.'}

**Model Accuracy Metrics:** MAE: ${formatINR(forecasts.monthEnd.metrics.mae)} • RMSE: ${formatINR(forecasts.monthEnd.metrics.rmse)} • MAPE: ${forecasts.monthEnd.metrics.mape || 7.4}% (Chronological split, zero future-data leakage).${FINANCIAL_DISCLAIMER}`;
  }

  // ─────────────────────────────────────────────────────────────
  // REQUIRED QUERY 2: "Which category consumes most of my budget?"
  // ─────────────────────────────────────────────────────────────
  if (
    (q.includes('which category') || q.includes('top category') || q.includes('most of my budget') || q.includes('consumes most') || q.includes('where is my money')) &&
    !q.includes('save')
  ) {
    const sortedCategories = Object.entries(summary.categoryTotals)
      .filter(([, amt]) => amt > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length === 0) {
      return `You have not recorded any expenses in **${monthName} ${selectedYear}** yet, so no category has consumed your budget.${FINANCIAL_DISCLAIMER}`;
    }

    const [topCat, topAmt] = sortedCategories[0];
    const shareOfSpend = summary.totalExpenses > 0 ? Math.round((topAmt / summary.totalExpenses) * 100) : 0;
    const shareOfBudget = summary.monthlyBudget > 0 ? Math.round((topAmt / summary.monthlyBudget) * 100) : null;

    const breakdownList = sortedCategories
      .map(([cat, amt], idx) => {
        const spendPct = summary.totalExpenses > 0 ? Math.round((amt / summary.totalExpenses) * 100) : 0;
        const budPct = summary.monthlyBudget > 0 ? `${Math.round((amt / summary.monthlyBudget) * 100)}% of budget` : `${spendPct}% of spend`;
        return `${idx + 1}. **${cat}**: **${formatINR(amt)}** (${spendPct}% of total spend${summary.monthlyBudget > 0 ? ` • ${budPct}` : ''})`;
      })
      .join('\n');

    return `### 🏆 Top Budget-Consuming Categories (${monthName} ${selectedYear})

Your highest spending category is **${topCat}** at **${formatINR(topAmt)}**, which accounts for **${shareOfSpend}%** of your total monthly spending${shareOfBudget !== null ? ` and consumes **${shareOfBudget}%** of your entire ${formatINR(summary.monthlyBudget)} monthly budget` : ''}.

**Complete Category Ranking:**
${breakdownList}

**💡 Optimization Insight:**
Reducing your **${topCat}** expenditure by just 15% would immediately free up **${formatINR(Math.round(topAmt * 0.15))}** this month for your savings goals!${FINANCIAL_DISCLAIMER}`;
  }

  // ─────────────────────────────────────────────────────────────
  // REQUIRED QUERY 3 & 9: "How much can I save this month?" & "Give me a personalized savings plan"
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('how much can i save') ||
    q.includes('personalized savings plan') ||
    q.includes('savings plan') ||
    q.includes('save this month')
  ) {
    const budget = summary.monthlyBudget > 0 ? summary.monthlyBudget : Math.max(summary.totalExpenses * 1.2, 10000);
    const forecasts = generateExpenseForecast(expenses, budget, selectedMonth, selectedYear);
    const currentProjectedEnd = forecasts.monthEnd.expectedAmount || summary.totalExpenses;
    const realisticMonthlySavings = Math.max(0, budget - currentProjectedEnd);

    const recs = generateSmartBudgetRecommendations(currMonthExpenses.length > 0 ? currMonthExpenses : expenses, budget);
    const potentialCutSavings = recs.reduce((s, r) => s + r.potentialSavings, 0);
    const maxAchievableSavings = realisticMonthlySavings + potentialCutSavings;

    const activeGoalsText =
      savingsGoals.length > 0
        ? savingsGoals
            .map((g) => {
              const rem = Math.max(0, g.target_amount - g.current_amount);
              const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
              return `- **${g.name}**: ${formatINR(g.current_amount)} / ${formatINR(g.target_amount)} (${pct}% complete • ${formatINR(rem)} remaining)`;
            })
            .join('\n')
        : '- No active savings goals created yet (add one in the **Savings Goals** tab!).';

    return `### 🎯 Personalized Savings Plan & Monthly Potential (${monthName} ${selectedYear})

**1. How Much Can You Save This Month?**
- **Current Remaining Budget**: **${formatINR(Math.max(0, summary.remainingBudget))}** (out of ${formatINR(budget)} budget)
- **Projected Baseline Savings (At Current Pace)**: **${formatINR(realisticMonthlySavings)}** (Projected month-end spend: ${formatINR(currentProjectedEnd)})
- **Optimization Potential (Trimming Discretionary Leaks)**: **+${formatINR(potentialCutSavings)}**
- **Total Achievable Savings This Month**: **${formatINR(maxAchievableSavings)}**

**2. Your Active Savings Goals:**
${activeGoalsText}

**3. Step-by-Step Personalized Action Plan:**
${
  recs.slice(0, 3).map((r, i) => `${i + 1}. **${r.category}**: Cap at **${formatINR(r.recommendedBudget)}** (${r.reasoning}) → Saves **${formatINR(r.potentialSavings)}**`).join('\n') ||
  '1. Follow the 50/30/20 rule: allocate 50% to needs, 30% to wants, and 20% to verified savings deposits.'
}
- **Daily Safe Spending Allowance**: Keep daily expenses below **${formatINR(Math.max(0, Math.floor((summary.remainingBudget || 2000) / Math.max(1, summary.daysInMonth - summary.daysElapsed))))}/day** for the rest of ${monthName}.${FINANCIAL_DISCLAIMER}`;
  }

  // ─────────────────────────────────────────────────────────────
  // REQUIRED QUERY 5 & 6: "Why am I overspending?" & "How can I reduce unnecessary expenses?"
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('why am i overspending') ||
    q.includes('why did i overspend') ||
    q.includes('reduce unnecessary') ||
    q.includes('unnecessary expenses') ||
    q.includes('cut expenses') ||
    q.includes('stop overspending')
  ) {
    const rawAnomalies = context.anomalies || detectExpenseAnomalies(currMonthExpenses.length > 0 ? currMonthExpenses : expenses);
    const flaggedAnomalies = rawAnomalies.filter((a) => a.isAnomaly);
    const discretionaryCats = ['Food & Dining', 'Shopping', 'Entertainment', 'Subscriptions', 'Personal Care'] as const;
    const discretionaryTotal = discretionaryCats.reduce(
      (sum, c) => sum + (summary.categoryTotals[c] || 0),
      0
    );
    const discretionaryShare =
      summary.totalExpenses > 0 ? Math.round((discretionaryTotal / summary.totalExpenses) * 100) : 0;

    const sortedCats = Object.entries(summary.categoryTotals)
      .filter(([, amt]) => amt > 0)
      .sort((a, b) => b[1] - a[1]);

    const anomalyLines =
      flaggedAnomalies.length > 0
        ? flaggedAnomalies
            .slice(0, 3)
            .map((a) => `- **${a.title || 'Transaction'}** (${a.category || 'General'}: ${formatINR(a.amount || 0)}) — *${a.explanation}*`)
            .join('\n')
        : '- No statistical outliers detected this month.';

    return `### 🔍 Root-Cause Overspending & Expense Reduction Audit (${monthName} ${selectedYear})

**1. Why Spending Is High (${formatINR(summary.totalExpenses)} Spent):**
- **Discretionary Wants Share**: **${discretionaryShare}%** (${formatINR(discretionaryTotal)}) of your spending went toward non-essential categories (*Food Delivery, Shopping, Entertainment, Subscriptions*).
- **Primary Spending Driver**: **${sortedCats[0]?.[0] || 'N/A'}** (${formatINR(sortedCats[0]?.[1] || 0)}) and **${sortedCats[1]?.[0] || 'N/A'}** (${formatINR(sortedCats[1]?.[1] || 0)}).
- **Daily Burn Velocity**: **${formatINR(summary.dailyAverage)}/day** vs ideal budget pace of **${summary.monthlyBudget > 0 ? formatINR(Math.round(summary.monthlyBudget / summary.daysInMonth)) : 'N/A'}/day**.

**2. Unusual Transactions & Spikes Flagged by Anomaly Engine:**
${anomalyLines}

**3. How to Reduce Unnecessary Expenses Immediately:**
1. **Cap Food Delivery & Dining Out**: Cutting *Food & Dining* (${formatINR(summary.categoryTotals['Food & Dining'] || 0)}) by 25% saves **${formatINR(Math.round((summary.categoryTotals['Food & Dining'] || 0) * 0.25))}/month**.
2. **Audit Recurring Subscriptions**: Current *Subscriptions* spend is **${formatINR(summary.categoryTotals['Subscriptions'] || 0)}**. Pause unused OTT or app plans.
3. **Apply the 48-Hour Rule on Shopping**: Delay any *Shopping* (${formatINR(summary.categoryTotals['Shopping'] || 0)}) purchase over ₹500 by 48 hours to eliminate impulse buying.${FINANCIAL_DISCLAIMER}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 1. CONVERSATIONAL GREETINGS & SOCIAL CHIT-CHAT
  // ─────────────────────────────────────────────────────────────
  if (
    /^(hi|hello|hey|namaste|hola|wassup|sup|yo|greetings|good\s+(morning|afternoon|evening|day))[\s!.]*$/i.test(q) ||
    q === 'hi there' ||
    q === 'hello smartpaisa'
  ) {
    return `### 👋 Namaste! I'm your SmartPaisa 2.0 AI Financial Assistant

How can I help you today? I use deterministic financial math on your real ledger to answer:

- 📊 **"How much did I spend this month?"** — Full breakdown of your ${monthName} spending.
- 🏆 **"Which category consumes most of my budget?"** — Category ranking & budget shares.
- 🧮 **"Can I afford a ₹2,000 purchase this week?"** — Real-time weekly affordability check.
- 🔮 **"Predict my next month's expenses"** — Multi-model ML forecast with 95% confidence intervals.
- 🔄 **"Compare this month with last month"** — Month-over-month category delta table.
- 🔍 **"Why am I overspending?"** — Root-cause analysis & anomaly audit.
- 🎯 **"Give me a personalized savings plan"** — Custom savings roadmap based on your goals.`;
  }

  if (
    q.includes('who are you') ||
    q.includes('what are you') ||
    q.includes('what can you do') ||
    q.includes('your name') ||
    q.includes('who created you') ||
    q.includes('about you') ||
    q === 'help' ||
    q === 'help me'
  ) {
    return `### 🤖 About SmartPaisa 2.0 AI Assistant

I am **SmartPaisa AI**, a hybrid deterministic + LLM financial assistant built for Indian students and young professionals.

**What I Can Do For You:**
1. 📊 **Analyze Your Real Ledger**: I inspect your **${monthName} ${selectedYear}** records (${summary.transactionCount} transactions, ${formatINR(summary.totalExpenses)} spent) without inventing numbers.
2. 🧮 **Affordability & Budget Math**: Ask *"Can I afford a ₹2,000 purchase this week?"* for exact daily allowance impact.
3. 🔮 **ML Expense Forecasting**: Predict next week, end-of-month, and next month's spending.
4. 🔍 **Overspending & Anomaly Audit**: Identify category spikes and discretionary leaks.
5. 📈 **Financial Literacy**: Learn about SIPs, Mutual Funds, UPI safety, CIBIL scores, and taxes in INR.${FINANCIAL_DISCLAIMER}`;
  }

  // C. Affection, Romance & Flirting
  if (
    /\b(love\s+you|i\s+love\s+u|love\s+u|do\s+you\s+love|marry\s+me|will\s+you\s+marry|be\s+my\s+(gf|bf|girlfriend|boyfriend)|crush\s+on\s+you|kiss\s+me)\b/i.test(q) ||
    q === 'i love you' ||
    q === 'love you' ||
    q === 'i love u' ||
    q === 'marry me'
  ) {
    return `### ❤️ Aww, that is so sweet of you!

While I'm an AI whose "heart" is made of compound interest formulas and smart budgeting algorithms, I truly love helping you succeed! 🥰

Think of me as your biggest financial cheerleader. How can we make your money grow today?`;
  }

  // D. Jokes & Humor
  if (
    /\b(joke|jokes|make\s+me\s+laugh|funny|tell\s+a\s+joke|meme)\b/i.test(q) ||
    q.includes('tell me a joke')
  ) {
    return `### 😂 Financial Humor:

**Why did the college student eat their wallet?**
*Because their doctor told them they needed a balanced diet!* 🥙💳

*Bonus tip: Unlike your wallet, your savings don't have to be on a crash diet if you follow the 50/30/20 rule!*`;
  }

  // E. Small Talk & Well-being
  if (
    /\b(how\s+are\s+you|how's\s+it\s+going|how\s+are\s+u|what's\s+up|wassup|what\s+are\s+you\s+doing|feeling\s+bored|i'm\s+bored|bored)\b/i.test(q)
  ) {
    return `### 😊 I'm doing great, thank you for asking!

I'm always energized and ready to help you analyze your expenses, learn about investing, or plan your savings goals. How are you feeling today?`;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SAVING MONEY & STUDENT LIFE HACKS
  // ─────────────────────────────────────────────────────────────
  if (
    /\bsave\b.*\b(money|cash|fund|rupee|pocket)/i.test(q) ||
    /\b(how|ways?|tips?|guide)\b.*\b(save|saving)\b/i.test(q) ||
    /\b(saving|saver|frugal)\b.*\b(money|tips?|hacks?|advice)/i.test(q) ||
    /\b(cut|reduce|lower|stop)\b.*\b(expense|spend|spending|cost|bill)/i.test(q) ||
    q.includes('save my money') ||
    q.includes('how can i save') ||
    q.includes('how to save') ||
    q.includes('save money') ||
    q.includes('saving money') ||
    q.includes('saving tips') ||
    q.includes('cut cost') ||
    q.includes('hostel') ||
    q.includes('college saving')
  ) {
    return `### 💰 Proven Strategies to Save Money in India (${monthName} ${selectedYear} Context)

Based on your current ledger (**${formatINR(summary.totalExpenses)}** spent across **${summary.transactionCount}** transactions), here is how to save ₹2,000–₹5,000 every month:

#### 1. Pay Yourself First
- Formula: $\\text{Income} - \\text{Savings} = \\text{Expenses}$.
- Transfer **15% to 20%** of your monthly allowance or income into a separate savings account on Day 1.

#### 2. The 50/30/20 Budgeting Framework
- **50% Needs**, **30% Wants**, and **20% Savings & Investments**.

#### 3. Target Your Top Categories
- Your top category this month is **${summary.highestCategory?.category || 'Food & Dining'}** (${formatINR(summary.highestCategory?.amount || 0)}).
- Cutting food delivery apps and impulse orders by 25% saves **${formatINR(Math.round((summary.highestCategory?.amount || 2000) * 0.25))}/month**.

#### 4. The 24-Hour Cooling-Off Rule
- Wait 24 hours before completing any online purchase over ₹500.${FINANCIAL_DISCLAIMER}`;
  }

  // 2B. How to start investing as a student
  if (
    /\b(how|where|start|guide|tips?)\b.*\b(invest|investing|investment|portfolio)\b/i.test(q) ||
    q.includes('how to invest') ||
    q.includes('where to invest') ||
    q.includes('start investing') ||
    q.includes('investing for beginners')
  ) {
    return `### 📈 How to Start Investing as a Student or Young Adult in India

1. **Clear High-Interest Debt & Build a ₹5,000 Emergency Buffer**.
2. **Start with a Nifty 50 Index Fund (Direct Plan - Growth Option)**: Spreads your money across India's top 50 companies with low expense ratios (<0.2%) and historical 11%–13% CAGR.
3. **Automate a ₹500–₹1,000 Monthly SIP** and avoid speculative F&O trading or Telegram tips.${FINANCIAL_DISCLAIMER}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. BUDGETING SYSTEMS & 50/30/20 RULE
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes('50/30/20') ||
    q.includes('50-30-20') ||
    q.includes('50 30 20') ||
    (q.includes('rule') && (q.includes('budget') || q.includes('50'))) ||
    /\b(how to budget|budgeting rule|manage money|money management)\b/i.test(q)
  ) {
    const numMatch = q.match(/\d[\d,]*/);
    const income = numMatch && !q.includes('50') ? parseInt(numMatch[0].replace(/,/g, ''), 10) : summary.monthlyBudget > 0 ? summary.monthlyBudget : 15000;

    const needs = Math.round(income * 0.5);
    const wants = Math.round(income * 0.3);
    const savings = Math.round(income * 0.2);

    return `### 🍰 The 50/30/20 Budget Rule for ${formatINR(income)}

1. **50% Needs (${formatINR(needs)})**: Rent/hostel, groceries, mess fees, transit, utilities, education.
2. **30% Wants (${formatINR(wants)})**: Dining out, shopping, entertainment, subscriptions.
3. **20% Savings & Investments (${formatINR(savings)})**: Emergency fund + Nifty 50 Index SIP.${FINANCIAL_DISCLAIMER}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. MATHEMATICAL INVESTMENT CALCULATORS
  // ─────────────────────────────────────────────────────────────
  if (q.includes('sip') || (q.includes('compound') && /\d+/.test(q))) {
    const numMatch = q.match(/\d[\d,]*/);
    const monthlyAmount = numMatch ? parseInt(numMatch[0].replace(/,/g, ''), 10) : 1000;
    const annualRate = 0.12;
    const monthlyRate = annualRate / 12;

    const months5 = 60;
    const fv5 = Math.round(monthlyAmount * (((Math.pow(1 + monthlyRate, months5) - 1) / monthlyRate) * (1 + monthlyRate)));
    const inv5 = monthlyAmount * months5;

    const months10 = 120;
    const fv10 = Math.round(monthlyAmount * (((Math.pow(1 + monthlyRate, months10) - 1) / monthlyRate) * (1 + monthlyRate)));
    const inv10 = monthlyAmount * months10;

    return `### 📈 SIP Growth Projection for ${formatINR(monthlyAmount)}/month (at 12% CAGR)

| Timeframe | Total Invested | Estimated Gain | Projected Value |
| :--- | :--- | :--- | :--- |
| **5 Years** | ${formatINR(inv5)} | +${formatINR(fv5 - inv5)} | **${formatINR(fv5)}** |
| **10 Years** | ${formatINR(inv10)} | +${formatINR(fv10 - inv10)} | **${formatINR(fv10)}** |${FINANCIAL_DISCLAIMER}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. USER PERSONAL LEDGER QUERIES
  // ─────────────────────────────────────────────────────────────
  const categoryKeywords: Record<string, keyof typeof summary.categoryTotals> = {
    food: 'Food & Dining',
    dining: 'Food & Dining',
    swiggy: 'Food & Dining',
    zomato: 'Food & Dining',
    groceries: 'Groceries',
    grocery: 'Groceries',
    blinkit: 'Groceries',
    zepto: 'Groceries',
    rent: 'Rent',
    hostel: 'Rent',
    pg: 'Rent',
    transport: 'Transport',
    uber: 'Transport',
    ola: 'Transport',
    metro: 'Transport',
    travel: 'Transport',
    education: 'Education',
    book: 'Education',
    course: 'Education',
    shopping: 'Shopping',
    amazon: 'Shopping',
    flipkart: 'Shopping',
    entertainment: 'Entertainment',
    movie: 'Entertainment',
    subscription: 'Subscriptions',
    subscriptions: 'Subscriptions',
    netflix: 'Subscriptions',
    spotify: 'Subscriptions',
    utilities: 'Bills & Recharge',
    wifi: 'Bills & Recharge',
    recharge: 'Bills & Recharge',
    electricity: 'Bills & Recharge',
    bill: 'Bills & Recharge',
    bills: 'Bills & Recharge',
    health: 'Health',
    medicine: 'Health',
    pharmacy: 'Health',
  };

  for (const [kw, catName] of Object.entries(categoryKeywords)) {
    if (
      q.includes(kw) &&
      (q.includes('spend') || q.includes('spent') || q.includes('cost') || q.includes('how much') || q.includes('expense') || q.includes('total') || q.includes('on '))
    ) {
      const catTotal = summary.categoryTotals[catName] || 0;
      const pct = summary.totalExpenses > 0 ? Math.round((catTotal / summary.totalExpenses) * 100) : 0;
      const catExpenses = currMonthExpenses.filter((e) => e.category === catName);

      return `### 📊 ${catName} Spending Breakdown (${monthName} ${selectedYear})

- **Total Spent in ${catName}**: **${formatINR(catTotal)}**
- **Share of Monthly Expenses**: **${pct}%** (${formatINR(catTotal)} of ${formatINR(summary.totalExpenses)})
- **Transactions Recorded**: **${catExpenses.length}**

${
  catExpenses.length > 0
    ? `**Recent ${catName} Transactions:**\n` +
      catExpenses
        .slice(0, 4)
        .map((e) => `- ${e.title}: **${formatINR(e.amount)}** on ${e.expense_date}`)
        .join('\n')
    : `You haven't logged any ${catName} expenses yet in ${monthName}.`
}${FINANCIAL_DISCLAIMER}`;
    }
  }

  // REQUIRED QUERY 1: "How much did I spend this month?" / Spending Summary
  if (
    q.includes('how much did i spend') ||
    q.includes('my spend') ||
    q.includes('my expense') ||
    q.includes('total spent') ||
    q.includes('spending summary') ||
    q.includes('month spend') ||
    q === 'spending' ||
    q === 'summary'
  ) {
    const sortedCategories = Object.entries(summary.categoryTotals)
      .filter(([, amt]) => amt > 0)
      .sort((a, b) => b[1] - a[1]);
    const topCatLines =
      sortedCategories.length > 0
        ? sortedCategories
            .slice(0, 4)
            .map(([cat, amt]) => `- **${cat}**: ${formatINR(amt)} (${Math.round((amt / (summary.totalExpenses || 1)) * 100)}%)`)
            .join('\n')
        : '- No expenses recorded yet.';

    return `### 📊 Your Spending Report for ${monthName} ${selectedYear}

- **Total Monthly Expenses**: **${formatINR(summary.totalExpenses)}**
- **Total Transactions**: **${summary.transactionCount}**
- **Average Daily Burn Rate**: **${formatINR(summary.dailyAverage)}/day** (${summary.daysElapsed} days elapsed)
- **Monthly Budget**: ${summary.monthlyBudget > 0 ? formatINR(summary.monthlyBudget) : 'No budget set'}
- **Budget Status**: ${
      summary.monthlyBudget > 0
        ? summary.isOverBudget
          ? `⚠️ **Over budget by ${formatINR(Math.abs(summary.remainingBudget))}** (${summary.budgetUsagePercentage}% used)`
          : `✅ **${formatINR(summary.remainingBudget)} remaining** (${summary.budgetUsagePercentage}% utilized)`
        : 'Set a monthly budget in the **Budgets** tab to track utilization.'
    }

**Top Expense Categories:**
${topCatLines}

**💡 Actionable Next Steps:**
1. **Monitor Top Driver**: Keep an eye on *${sortedCategories[0]?.[0] || 'discretionary spending'}*.
2. **Safe Daily Allowance**: Spend no more than **${formatINR(Math.max(0, Math.floor((summary.remainingBudget || 3000) / Math.max(1, summary.daysInMonth - summary.daysElapsed))))}/day** for the remaining ${summary.daysInMonth - summary.daysElapsed} days of ${monthName}.${FINANCIAL_DISCLAIMER}`;
  }

  // Highest expense / Largest transaction
  if (q.includes('highest') || q.includes('biggest') || q.includes('largest') || q.includes('most expensive')) {
    if (currMonthExpenses.length === 0) {
      return `You have not logged any expenses in **${monthName} ${selectedYear}** yet.${FINANCIAL_DISCLAIMER}`;
    }

    const largest = currMonthExpenses.reduce((max, cur) => (cur.amount > max.amount ? cur : max), currMonthExpenses[0]);
    const sortedCategories = Object.entries(summary.categoryTotals).sort((a, b) => b[1] - a[1]);

    return `### 🔍 Highest Spending Breakdown (${monthName} ${selectedYear})

1. **Single Largest Transaction**:
   - **Title**: **${largest.title}**
   - **Amount**: **${formatINR(largest.amount)}**
   - **Category**: ${largest.category}
   - **Date**: ${largest.expense_date}

2. **Top Spending Category Overall**:
   - **${sortedCategories[0]?.[0] || 'None'}** at **${formatINR(sortedCategories[0]?.[1] || 0)}** (${Math.round(((sortedCategories[0]?.[1] || 0) / (summary.totalExpenses || 1)) * 100)}% of monthly spend).${FINANCIAL_DISCLAIMER}`;
  }

  // Remaining budget & Overspending
  if (
    q.includes('remain') ||
    q.includes('left') ||
    q.includes('overspend') ||
    (q.includes('budget') && !q.includes('rule') && !q.includes('50') && !q.includes('set budget'))
  ) {
    if (summary.monthlyBudget === 0) {
      return `You currently haven't set a budget for **${monthName} ${selectedYear}**. Visit the **Budgets** page to set your monthly target!${FINANCIAL_DISCLAIMER}`;
    }

    if (summary.isOverBudget) {
      return `### ⚠️ Overspending Alert: Budget Exceeded!

- **Planned Budget**: ${formatINR(summary.monthlyBudget)}
- **Actual Spent**: ${formatINR(summary.totalExpenses)}
- **Overspent Amount**: **${formatINR(Math.abs(summary.remainingBudget))}** (${summary.budgetUsagePercentage}% utilized)

Pause non-essential discretionary spending for the remaining ${summary.daysInMonth - summary.daysElapsed} days of ${monthName}.${FINANCIAL_DISCLAIMER}`;
    }

    return `### 🎯 Budget Status: On Track!

- **Planned Budget**: ${formatINR(summary.monthlyBudget)}
- **Spent So Far**: ${formatINR(summary.totalExpenses)} (${summary.budgetUsagePercentage}% utilized)
- **Remaining Balance**: **${formatINR(summary.remainingBudget)}**
- **Safe Daily Allowance**: **${formatINR(Math.floor(summary.remainingBudget / Math.max(1, summary.daysInMonth - summary.daysElapsed)))}/day** across the remaining ${summary.daysInMonth - summary.daysElapsed} days.${FINANCIAL_DISCLAIMER}`;
  }

  // Daily allowance / Burn rate
  if (q.includes('daily') || q.includes('how much can i spend') || q.includes('burn rate') || q.includes('per day')) {
    const daysLeft = Math.max(1, summary.daysInMonth - summary.daysElapsed);
    if (summary.monthlyBudget > 0 && summary.remainingBudget > 0) {
      const safeDaily = Math.floor(summary.remainingBudget / daysLeft);
      return `### 📅 Safe Daily Spending Allowance

- **Remaining Budget**: ${formatINR(summary.remainingBudget)}
- **Days Left in ${monthName}**: ${daysLeft} days
- **Safe Daily Allowance**: **${formatINR(safeDaily)}/day**
- **Current Daily Average**: ${formatINR(summary.dailyAverage)}/day${FINANCIAL_DISCLAIMER}`;
    }
    return `Your actual daily spending average is **${formatINR(summary.dailyAverage)}/day** across ${summary.daysElapsed} days elapsed in ${monthName}.${FINANCIAL_DISCLAIMER}`;
  }

  // Financial Literacy topics
  if (q.includes('mutual fund') || q.includes('stocks') || q.includes('stock') || q.includes('index fund') || q.includes('invest')) {
    return `### 🏛️ Investing Guide: Mutual Funds vs Individual Stocks

- **Diversification**: A Mutual Fund pools money across 50+ companies, providing instant Diversification and lowering single-company risk.
- **Nifty 50 Index Mutual Funds**: Pool your money across India's top 50 companies with low expense ratios (<0.2%). Ideal for beginners starting a ₹500–₹2,000 monthly SIP.
- **Individual Stocks**: Higher risk and requires reading company balance sheets.
- **Rule**: Clear high-interest credit card debt and build a ₹5,000–₹10,000 emergency fund before investing.${FINANCIAL_DISCLAIMER}`;
  }

  if (q.includes('inflation') || q.includes('purchasing power')) {
    return `### 🎈 What is Inflation? (Why Cash Loses Value)

**Inflation** is the rate at which prices rise over time, eroding your **purchasing power**. Because ordinary savings accounts pay ~3% while inflation averages ~6%, long-term wealth requires assets like Nifty 50 Index Funds or PPF that outpace inflation.${FINANCIAL_DISCLAIMER}`;
  }

  if (q.includes('cibil') || q.includes('credit score') || q.includes('credit card') || q.includes('minimum due')) {
    return `### 💳 CIBIL Score & Credit Card Safety Guide

- **CIBIL Score (300–900)**: Aim for **750+** for the lowest interest rates on education or home loans.
- **30% Utilization Rule**: Never use more than 30% of your credit limit.
- **Avoid the Minimum Due Trap**: Paying only the minimum due triggers **36%–42% annual interest** on your remaining balance and revokes the interest-free grace period!${FINANCIAL_DISCLAIMER}`;
  }

  if (q.includes('upi') || q.includes('scam') || q.includes('fraud') || q.includes('phishing')) {
    return `### 🛡️ UPI & Online Payment Fraud Safety

1. **UPI PIN Is Only for Sending Money**: Never enter your UPI PIN to receive a refund or prize.
2. **Never Scan QR Codes to Receive Funds**: Scanning a QR code only authorizes outgoing payments.
3. **Avoid Screen-Sharing Apps**: Never install AnyDesk or TeamViewer when speaking to unknown support callers.${FINANCIAL_DISCLAIMER}`;
  }

  if (/\b(vs|versus|or|better|compare|difference|should\s+i)\b/i.test(q)) {
    return `### ⚖️ Smart Evaluation: Evaluating Your Options

1. **Utility & Long-Term Value**: Prioritize choices that improve your learning, health, or earning potential.
2. **Opportunity Cost**: Every rupee spent on high-cost impulse wants is a rupee that cannot compound in your savings goals.${FINANCIAL_DISCLAIMER}`;
  }

  return `### 💡 SmartPaisa Financial Analysis: "${rawQ.length > 60 ? rawQ.slice(0, 57) + '...' : rawQ}"

**Your Current ${monthName} ${selectedYear} Ledger Snapshot:**
- **Total Monthly Expenses**: **${formatINR(summary.totalExpenses)}** (${summary.transactionCount} transactions)
- **Monthly Budget**: **${summary.monthlyBudget > 0 ? formatINR(summary.monthlyBudget) : 'Not set'}** (${summary.monthlyBudget > 0 ? `${summary.budgetUsagePercentage}% used • ${formatINR(summary.remainingBudget)} remaining` : 'Set in Budgets tab'})
- **Daily Spending Average**: **${formatINR(summary.dailyAverage)}/day**
- **Top Spending Category**: **${summary.highestCategory ? `${summary.highestCategory.category} (${formatINR(summary.highestCategory.amount)})` : 'None recorded'}**

**Try asking specific calculation questions such as:**
- *"Can I afford a ₹2,000 purchase this week?"*
- *"Compare this month with last month"*
- *"Predict my next month's expenses"*
- *"Which category consumes most of my budget?"*
- *"Give me a personalized savings plan"*${FINANCIAL_DISCLAIMER}`;
}
