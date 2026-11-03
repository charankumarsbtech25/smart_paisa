import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatINR } from '@/utils/currency';
import { Button } from '@/components/common/Button';
import {
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  ReceiptIndianRupee,
  CheckCircle2,
  Award,
  BookOpen,
  Sparkles,
  PiggyBank,
  LifeBuoy,
  AlertOctagon,
  Percent,
  Landmark,
  Repeat,
} from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: 'When receiving money via UPI from someone, do you ever need to enter your UPI PIN?',
    options: [
      'Yes, to authenticate receiving the funds',
      'No! UPI PIN is only entered when sending/deducting money from your account',
      'Only if the amount is greater than ₹2,000',
      'Yes, if it is a Google Pay scratch card reward',
    ],
    correctIndex: 1,
    explanation:
      'Entering your UPI PIN ALWAYS transfers money OUT of your bank account. You never need a PIN to receive payments.',
  },
  {
    question: 'Under the 50/30/20 budgeting rule, what do the three numbers represent?',
    options: [
      '50% Needs (Mess, PG, Books), 30% Wants (Outings, Movies), 20% Savings/Investments',
      '50% Food, 30% Travel, 20% Tuition',
      '50% Investments, 30% Savings, 20% Spending',
      '50% Fixed deposits, 30% Stocks, 20% Cash',
    ],
    correctIndex: 0,
    explanation:
      'The 50/30/20 rule balances 50% for essential needs, 30% for lifestyle wants, and 20% for future savings and emergency buffer.',
  },
  {
    question: 'What is the "Minimum Amount Due" trap on Credit Cards?',
    options: [
      'Paying only the minimum due avoids all interest charges',
      'Paying minimum due triggers exorbitant 36%–45% APR interest on your remaining balance',
      'It increases your credit limit immediately',
      'It guarantees a perfect 900 CIBIL score',
    ],
    correctIndex: 1,
    explanation:
      'Paying only the minimum due avoids late fee penalties, but the unpaid balance accrues aggressive 3%–3.5% monthly interest (~42% APR). Always pay the Total Due in full.',
  },
  {
    question:
      'According to the "Rule of 72", if your investment earns 12% annually in an index fund, how many years does it take to double your money?',
    options: ['12 years', '6 years (72 ÷ 12)', '10 years', '24 years'],
    correctIndex: 1,
    explanation:
      'The Rule of 72 states: 72 divided by the expected annual interest rate equals the approximate years to double. 72 / 12 = 6 years.',
  },
  {
    question:
      'How many months of essential living expenses should a standard Emergency Fund ideally cover?',
    options: [
      '3 to 6 months of essential expenses parked in a liquid or high-yield account',
      '1 week of expenses invested in cryptocurrency',
      '10 years of expenses kept in physical cash',
      'Emergency funds are unnecessary if you have a credit card',
    ],
    correctIndex: 0,
    explanation:
      '3 to 6 months of essential expenses (or ₹5,000–₹15,000 for students) in a liquid account protects you from medical or academic emergencies without taking high-interest debt.',
  },
  {
    question:
      'Which debt repayment strategy mathematically saves the most money on interest charges?',
    options: [
      'Debt Avalanche (paying off the loan with the highest interest rate first)',
      'Taking a new instant app loan to pay an old loan',
      'Paying only minimum dues on all cards',
      'Ignoring small subscription charges',
    ],
    correctIndex: 0,
    explanation:
      'The Debt Avalanche method targets the highest APR debt first (such as 42% credit cards before 9% education loans), minimizing total interest paid.',
  },
];

const MODULES = [
  {
    id: 'budgeting',
    title: '1. Personal Budgeting (50/30/20 Rule)',
    icon: ReceiptIndianRupee,
    badge: 'Core Habit',
    summary:
      'Structure a ₹12,000–₹25,000 monthly allowance so you never run out of money before month-end.',
    content: `### Personal Budgeting & The 50/30/20 Framework
- **50% Needs (₹6,000 on a ₹12,000 budget)**: Hostel/PG rent, college mess fee, metro/bus pass, groceries, and mobile data recharge.
- **30% Wants (₹3,600 on a ₹12,000 budget)**: Weekend cafe outings, Swiggy/Zomato orders, movies, and casual shopping.
- **20% Savings (₹2,400 on a ₹12,000 budget)**: Emergency fund deposits and Nifty 50 Index SIPs.

**Practical INR Example:**
If your monthly budget is ₹12,000 and you have spent ₹7,500 by the 15th of the month, your remaining ₹4,500 across 15 days gives you a **Safe Daily Allowance of ₹300/day**. Tracking this daily cap prevents end-of-month crunches!`,
  },
  {
    id: 'saving-money',
    title: '2. Saving Money & Pay Yourself First',
    icon: PiggyBank,
    badge: 'Wealth Habit',
    summary:
      'Automate monthly savings using the Pay Yourself First rule and student discount strategies.',
    content: `### How to Save ₹2,000–₹5,000 Every Month
1. **Pay Yourself First**: Instead of saving whatever is left on the 30th ($\text{Income} - \text{Expenses} = \text{Savings}$), transfer 20% to a separate savings account on Day 1 ($\text{Income} - \text{Savings} = \text{Expenses}$).
2. **Cut Food Delivery Surge Fees**: Ordering a ₹200 meal on food delivery apps often costs ₹285 after packaging, platform fees, and GST. Walking to a local eatery or eating mess meals 3 times a week saves **₹1,500/month**.
3. **24-Hour Impulse Rule**: Wait 24 hours before buying any non-essential item above ₹500 on Amazon or Myntra.`,
  },
  {
    id: 'emergency-funds',
    title: '3. Emergency Funds & Safety Buffers',
    icon: LifeBuoy,
    badge: 'Financial Shield',
    summary:
      'Build a dedicated contingency buffer for medical needs, sudden laptop repairs, or urgent travel.',
    content: `### Building Your Emergency Fund in INR
An **Emergency Fund** protects you from falling into 36%+ instant loan app traps when life throws a surprise.
- **Target for Students**: **₹5,000 to ₹15,000** (covers 1–2 months of mess fees, urgent train/flight ticket home, or laptop repair before exams).
- **Target for Working Professionals**: **3 to 6 months** of essential living expenses (e.g., ₹75,000–₹1,50,000 if monthly needs are ₹25,000).
- **Where to Keep It**: Park it in a separate high-yield bank account or a Liquid Mutual Fund—never link your emergency account to your primary daily UPI app!`,
  },
  {
    id: 'upi-safety',
    title: '4. UPI Safety & NPCI Best Practices',
    icon: ShieldCheck,
    badge: 'Daily Security',
    summary:
      'Protect your daily UPI transactions with UPI Lite, daily limits, and PIN verification rules.',
    content: `### Essential UPI Safety Rules
1. **UPI PIN Is Strictly for Deducting Money**: You NEVER enter your 4 or 6-digit UPI PIN to receive money, claim a refund, or unlock a cashback reward.
2. **Use UPI Lite for Small Daily Spends**: Enable **UPI Lite** (up to ₹500 per transaction, ₹2,000 wallet balance) for canteen chai, auto fares, and groceries—it keeps your main bank statement clean and doesn't expose your main UPI PIN in public.
3. **Verify the Verified Merchant Name**: Always check the registered banking name shown on the UPI screen before hitting Pay.`,
  },
  {
    id: 'fraud-awareness',
    title: '5. Online Payment Fraud Awareness',
    icon: AlertOctagon,
    badge: 'Cyber Defense',
    summary:
      'Spot QR code scams, fake customer care numbers, screen-sharing traps, and phishing links.',
    content: `### Recognizing & Stopping Digital Payment Scams
1. **QR Code "Receive Money" Scam**: Fraudsters on OLX or marketplaces send a QR code claiming "scan to receive ₹5,000". Scanning a QR code only sends money out.
2. **Fake Customer Support Ads**: Never search Google or Twitter for helpline numbers of delivery apps or banks. Use only the official in-app support center.
3. **Screen-Sharing Apps (AnyDesk / TeamViewer)**: Never install remote-access apps when speaking to someone claiming to be from a bank or KYC team.
4. **Golden Hour Reporting**: If defrauded, immediately call **1930** (National Cyber Crime Helpline) or file a complaint at **cybercrime.gov.in** to freeze the recipient's bank account.`,
  },
  {
    id: 'credit-cards',
    title: '6. Credit Cards & CIBIL Score Mastery',
    icon: CreditCard,
    badge: 'Credit Mastery',
    summary:
      'Build a 750+ CIBIL score safely while avoiding the 42% APR Minimum Due debt spiral.',
    content: `### Using Credit Cards Without Falling Into Debt
- **CIBIL Score (300–900)**: A score of **750+** unlocks the lowest interest rates on future education, car, or home loans.
- **Credit Utilization Ratio (<30%)**: If your card limit is ₹20,000, keep monthly statement spending under **₹6,000**.
- **The Minimum Due Trap**: If your bill is ₹10,000 and you pay only the ₹500 "Minimum Amount Due", the bank charges **3.5% per month (42% per year)** on the remaining ₹9,500 AND removes your interest-free period on all new purchases! Always pay **100% Total Amount Due**.`,
  },
  {
    id: 'interest-rates',
    title: '7. Interest Rates, Inflation & Compounding',
    icon: Percent,
    badge: 'Financial Math',
    summary:
      'Understand real vs nominal returns, inflation erosion, Rule of 72, and APR vs flat interest.',
    content: `### How Interest Rates Work For (and Against) You
1. **Inflation vs Savings Account**: If your bank pays **3% p.a.** interest and inflation in India is **6% p.a.**, ₹10,000 sitting idle in cash loses **₹300 of purchasing power** every year.
2. **The Rule of 72**: Divide 72 by the annual return rate to find how fast your money doubles:
   - Savings Account (3%): $72 \\div 3 = 24\\text{ years}$
   - Fixed Deposit / PPF (7.1%): $72 \\div 7.1 \\approx 10.1\\text{ years}$
   - Nifty 50 Index Fund (12%): $72 \\div 12 = 6\\text{ years}$
3. **Flat vs Reducing Balance Rate**: A "10% flat interest rate" on a loan actually costs ~18% effective APR because interest is charged on the full initial principal even as you pay it down!`,
  },
  {
    id: 'loans-debt',
    title: '8. Loans & Debt Management (Section 80E)',
    icon: Landmark,
    badge: 'Debt Strategy',
    summary:
      'Manage education loans wisely, avoid BNPL/instant loan apps, and use Avalanche vs Snowball.',
    content: `### Smart Debt Management in India
1. **Good Debt vs Toxic Debt**:
   - **Education Loans (8.5%–10.5% p.a.)**: Invests in your earning power and qualifies for **Section 80E tax deductions** on interest paid for up to 8 years.
   - **BNPL & Instant Loan Apps (30%–48% p.a.)**: High-cost consumer debt that damages your CIBIL report by opening multiple micro-loan accounts.
2. **Repayment Strategies**:
   - **Debt Avalanche**: Pay extra toward the loan with the **highest interest rate** first (mathematically saves the most ₹).
   - **Debt Snowball**: Pay off the **smallest balance** first for quick psychological wins.`,
  },
  {
    id: 'subscriptions',
    title: '9. Subscription Management & Auto-Debit Audits',
    icon: Repeat,
    badge: 'Leak Prevention',
    summary:
      'Stop silent recurring leaks across OTT apps, cloud storage, SaaS tools, and gym memberships.',
    content: `### Auditing Recurring Subscriptions
Small monthly auto-debits feel painless individually, but compound into huge annual leaks:
- Netflix Mobile (₹149) + Spotify (₹119) + YouTube Premium (₹149) + Cloud Storage (₹130) + Food Membership (₹99) = **₹646/month** or **₹7,752/year**!

**3-Step Subscription Audit:**
1. **Use Student Plans**: Spotify Student (₹59/mo), Apple Music Student (₹59/mo), and GitHub Student Developer Pack (₹0—saves ₹15,000+/yr on developer tools).
2. **Rotate OTT Platforms**: Keep only 1 streaming service active per month instead of paying for 4 simultaneously.
3. **Check RBI E-Mandate Portal**: Review and revoke unused UPI Autopay mandates directly inside your UPI app every quarter.`,
  },
  {
    id: 'student-planning',
    title: '10. Financial Planning for Students',
    icon: TrendingUp,
    badge: 'Future Roadmap',
    summary:
      'Transition from pocket money to internships, freelancing taxes (TDS/ITR), and your first SIP.',
    content: `### Complete Financial Roadmap for Indian Students
1. **Semester Sinking Funds**: If your semester exam/hostel fee of ₹18,000 is due in 6 months, set aside **₹3,000/month** in a recurring deposit or SmartPaisa Savings Goal.
2. **Freelancing & Stipend Taxes (TDS)**:
   - Under India's New Tax Regime, annual income up to **₹7,00,000 is 100% tax-free**.
   - If an internship or freelance client deducts **10% TDS** (e.g., ₹1,500 deducted from a ₹15,000 stipend), file a free **ITR-1/ITR-4** on the Income Tax portal to get a **100% refund** into your bank account!
3. **First Investment Step**: Once your ₹5,000 emergency buffer is ready, start a **₹500/month SIP** in a Direct Nifty 50 Index Fund.`,
  },
];

const COMPLETED_MODULES_STORAGE_KEY = 'smartpaisa_completed_lessons_v2';

export const LearnPage: React.FC = () => {
  const { summary, healthScore } = useFinance();
  const [activeModule, setActiveModule] = useState<string>('budgeting');
  const [completedModules, setCompletedModules] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(COMPLETED_MODULES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['budgeting'];
    } catch {
      return ['budgeting'];
    }
  });
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(COMPLETED_MODULES_STORAGE_KEY, JSON.stringify(completedModules));
    } catch {
      // Ignore storage error
    }
  }, [completedModules]);

  const currentModule = MODULES.find((m) => m.id === activeModule) || MODULES[0];
  const progressPct = Math.round((completedModules.length / MODULES.length) * 100);

  const toggleModuleCompletion = (id: string) => {
    setCompletedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // Personalized Educational Recommendations based on actual user ledger & Health Score
  const personalizedRecommendations = useMemo(() => {
    const recs: { moduleId: string; title: string; reason: string }[] = [];

    if (summary.isOverBudget || healthScore.budgetAdherence < 22) {
      recs.push({
        moduleId: 'budgeting',
        title: '1. Personal Budgeting (50/30/20 Rule)',
        reason: `Your budget utilization is currently ${summary.budgetUsagePercentage}%. Learn daily allowance pacing to stay on track.`,
      });
    }

    if (healthScore.emergencyFund < 10) {
      recs.push({
        moduleId: 'emergency-funds',
        title: '3. Emergency Funds & Safety Buffers',
        reason: `Your emergency savings component is ${healthScore.emergencyFund}/15. Build a ₹5,000–₹10,000 contingency shield.`,
      });
    }

    if ((summary.categoryTotals['Subscriptions'] || 0) + (summary.categoryTotals['Entertainment'] || 0) > 500) {
      recs.push({
        moduleId: 'subscriptions',
        title: '9. Subscription Management & Auto-Debit Audits',
        reason: `You spent ${formatINR((summary.categoryTotals['Subscriptions'] || 0) + (summary.categoryTotals['Entertainment'] || 0))} on Subscriptions & Entertainment this month.`,
      });
    }

    if (recs.length < 2) {
      recs.push({
        moduleId: 'upi-safety',
        title: '4. UPI Safety & NPCI Best Practices',
        reason: 'Essential security guide for daily UPI transactions and QR code fraud prevention.',
      });
      recs.push({
        moduleId: 'student-planning',
        title: '10. Financial Planning for Students',
        reason: 'Learn how to claim 100% TDS refunds on internship stipends and start a ₹500 SIP.',
      });
    }

    return recs.slice(0, 3);
  }, [summary, healthScore]);

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (submittedQuiz) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateQuizScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) score += 1;
    });
    return score;
  };

  const quizScore = calculateQuizScore();

  return (
    <div className="space-y-6">
      {/* Hero Header with Learning Progress */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-900/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>SmartPaisa Financial Literacy Centre • 10 INR Modules</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Financial Education & Cyber Safety
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Master personal budgeting, emergency funds, UPI safety, credit cards, interest rates, debt management, and student financial planning with practical examples in ₹ INR.
            </p>
          </div>

          {/* Learning Progress Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-indigo-200">Your Learning Progress</span>
              <span className="text-emerald-300">
                {completedModules.length} / {MODULES.length} Completed ({progressPct}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-300 mt-2">
              {progressPct === 100
                ? '🏆 All 10 financial literacy modules mastered!'
                : 'Mark lessons complete as you finish reading each topic.'}
            </p>
          </div>
        </div>
      </div>

      {/* Personalized Educational Recommendations */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
            Personalized Recommendations For Your Ledger (Health Score: {healthScore.overallScore}/100)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {personalizedRecommendations.map((rec) => (
            <button
              key={rec.moduleId}
              type="button"
              onClick={() => setActiveModule(rec.moduleId)}
              className="text-left bg-white hover:bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/70 transition-all shadow-2xs"
            >
              <p className="text-xs font-bold text-slate-900">{rec.title}</p>
              <p className="text-[11px] text-slate-600 mt-1">{rec.reason}</p>
              <span className="inline-block mt-2 text-[11px] font-bold text-emerald-700">
                Open Lesson →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Learning Hub Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Nav Links (10 Topics) */}
        <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
          <h3 className="font-bold text-slate-900 text-sm px-1">
            All 10 Curriculum Topics
          </h3>
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.id === activeModule;
            const isDone = completedModules.includes(mod.id);
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  isActive
                    ? 'bg-emerald-50/80 border-emerald-400 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      {mod.badge}
                    </span>
                    {isDone && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mt-0.5 leading-snug">
                    {mod.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {mod.summary}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Module Content Viewer */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{currentModule.badge} • Practical INR Guide</span>
              </div>

              <Button
                variant={completedModules.includes(currentModule.id) ? 'outline' : 'primary'}
                size="sm"
                onClick={() => toggleModuleCompletion(currentModule.id)}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                {completedModules.includes(currentModule.id)
                  ? 'Completed ✓'
                  : 'Mark Lesson Complete'}
              </Button>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {currentModule.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{currentModule.summary}</p>

            <div className="prose prose-sm prose-slate mt-5 text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-700 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
              {currentModule.content}
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const idx = MODULES.findIndex((m) => m.id === currentModule.id);
                  const nextIdx = (idx + 1) % MODULES.length;
                  if (!completedModules.includes(currentModule.id)) {
                    toggleModuleCompletion(currentModule.id);
                  }
                  setActiveModule(MODULES[nextIdx].id);
                }}
              >
                Complete & Next Lesson →
              </Button>
            </div>
            <a
              href="#quiz-section"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
            >
              Take Interactive Financial IQ Quiz ↓
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Financial IQ Quiz Section */}
      <div
        id="quiz-section"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>SmartPaisa Interactive Financial IQ Quiz</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {QUIZ_QUESTIONS.length} scenario-based questions covering budgeting, UPI fraud, credit cards, compounding, emergency funds, and debt management.
            </p>
          </div>

          {submittedQuiz && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>
                Your Score: {quizScore} / {QUIZ_QUESTIONS.length} (
                {Math.round((quizScore / QUIZ_QUESTIONS.length) * 100)}%)
              </span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {QUIZ_QUESTIONS.map((q, qIdx) => {
            const isCorrect = selectedAnswers[qIdx] === q.correctIndex;

            return (
              <div key={qIdx} className="space-y-3">
                <p className="font-semibold text-xs sm:text-sm text-slate-900">
                  {qIdx + 1}. {q.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[qIdx] === optIdx;
                    let btnStyle =
                      'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800';

                    if (submittedQuiz) {
                      if (optIdx === q.correctIndex) {
                        btnStyle =
                          'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-rose-100 border-rose-300 text-rose-900 font-medium';
                      }
                    } else if (isSelected) {
                      btnStyle = 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold';
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`text-left p-3 rounded-xl border text-xs transition-all ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {submittedQuiz && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    💡 <strong className="font-semibold">Explanation:</strong> {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {Object.keys(selectedAnswers).length} of {QUIZ_QUESTIONS.length} answered
          </span>

          {!submittedQuiz ? (
            <Button
              variant="primary"
              size="sm"
              disabled={Object.keys(selectedAnswers).length < QUIZ_QUESTIONS.length}
              onClick={() => setSubmittedQuiz(true)}
            >
              Submit Quiz & View Score
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAnswers({});
                setSubmittedQuiz(false);
              }}
            >
              Retake Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
