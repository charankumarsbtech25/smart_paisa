import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatINR } from '@/utils/currency';
import { getMonthName } from '@/utils/date';
import { explainFinancialQuery, sanitizeAiPrompt } from '@/utils/aiKnowledgeEngine';
import { Button } from '@/components/common/Button';
import { ChatMarkdown } from '@/components/common/ChatMarkdown';
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  ShieldCheck,
  TrendingDown,
  PiggyBank,
  PieChart,
  HelpCircle,
  Calculator,
  TrendingUp,
  ArrowLeftRight,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: 'openai' | 'rule-engine';
}

const SUGGESTED_QUESTIONS = [
  { text: 'How much did I spend this month?', icon: PieChart },
  { text: 'Which category consumes most of my budget?', icon: TrendingDown },
  { text: 'How much can I save this month?', icon: PiggyBank },
  { text: 'Can I afford a ₹2,000 purchase this week?', icon: Calculator },
  { text: 'Why am I overspending?', icon: AlertTriangle },
  { text: 'How can I reduce unnecessary expenses?', icon: HelpCircle },
  { text: "Predict my next month's expenses", icon: TrendingUp },
  { text: 'Compare this month with last month', icon: ArrowLeftRight },
  { text: 'Give me a personalized savings plan', icon: Sparkles },
];

export const AiAssistantPage: React.FC = () => {
  const {
    summary,
    selectedMonth,
    selectedYear,
    expenses,
    savingsGoals,
    healthScore,
  } = useFinance();
  const { isDemoMode } = useAuth();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('smartpaisa_ai_chat');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [
      {
        id: 'welcome-1',
        sender: 'assistant',
        content: `Namaste! I am your **SmartPaisa 2.0 AI Financial Assistant**.

I combine **deterministic financial calculations** (SQL/TypeScript/Python) with **OpenAI GPT-4o-mini** via secure Supabase Edge Functions—meaning I never invent balances, totals, or forecasts.

Ask me anything about your finances:
- 📊 *"How much did I spend this month?"*
- 🏆 *"Which category consumes most of my budget?"*
- 🧮 *"Can I afford a ₹2,000 purchase this week?"*
- 🔮 *"Predict my next month's expenses"*
- 🔄 *"Compare this month with last month"*
- 🔍 *"Why am I overspending?"* & *"How can I reduce unnecessary expenses?"*
- 🎯 *"Give me a personalized savings plan"*

*Disclaimer: Insights are educational and based on your recorded ledger, not SEBI-registered investment advice.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'rule-engine',
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem('smartpaisa_ai_chat', JSON.stringify(messages));
  }, [messages]);

  const handleClearChat = () => {
    const resetMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'assistant',
      content: `Chat history cleared. Ready to analyze your **${getMonthName(selectedMonth)} ${selectedYear}** finances (${formatINR(summary.totalExpenses)} spent across ${summary.transactionCount} transactions)!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'rule-engine',
    };
    setMessages([resetMsg]);
    localStorage.removeItem('smartpaisa_ai_chat');
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (queryText?: string) => {
    const rawText = (queryText || inputPrompt).trim();
    if (!rawText || loading) return;

    const sanitization = sanitizeAiPrompt(rawText);
    const textToSend = sanitization.sanitized;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: rawText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      let assistantReply = '';
      let replySource: 'openai' | 'rule-engine' = 'rule-engine';

      // First compute exact deterministic answer from our local financial calculation engine
      const deterministicReply = explainFinancialQuery(rawText, {
        summary,
        selectedMonth,
        selectedYear,
        expenses,
        savingsGoals,
        healthScore,
      });

      // If prompt was flagged for injection, return security guardrail immediately without calling Edge Function
      if (sanitization.flagged) {
        assistantReply = deterministicReply;
      } else if (isSupabaseConfigured && !isDemoMode) {
        // Call secure Supabase Edge Function (OpenAI GPT-4o-mini) with minimal aggregated context & conversation history
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;

          if (token) {
            const historyContext = messages.slice(-6).map((m) => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.content.slice(0, 350),
            }));

            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smartpaisa-ai`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  message: textToSend,
                  month: selectedMonth,
                  year: selectedYear,
                  history: historyContext,
                  deterministicCalculation: deterministicReply,
                  mode: textToSend.toLowerCase().includes('summary') ? 'summary' : 'chat',
                }),
              }
            );

            if (response.ok) {
              const resJson = await response.json();
              if (resJson.reply) {
                assistantReply = resJson.reply;
                replySource = resJson.source === 'openai' ? 'openai' : 'rule-engine';
              }
            }
          }
        } catch {
          // Graceful fallback to deterministic financial calculation engine
        }
      }

      if (!assistantReply) {
        await new Promise((resolve) => setTimeout(resolve, 180));
        assistantReply = deterministicReply;
        replySource = 'rule-engine';
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: replySource,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI chat error:', err);
      const fallbackReply = explainFinancialQuery(rawText, {
        summary,
        selectedMonth,
        selectedYear,
        expenses,
        savingsGoals,
        healthScore,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `recovery-${Date.now()}`,
          sender: 'assistant',
          content: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'rule-engine',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100dvh-195px)] lg:h-[calc(100vh-140px)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>SmartPaisa AI Financial Assistant</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                GPT-4o-mini + Deterministic Math
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Accurate calculations from your {getMonthName(selectedMonth)} {selectedYear} ledger • Zero fabricated balances
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            icon={<Trash2 className="w-3.5 h-3.5 text-slate-500" />}
          >
            Clear History
          </Button>
        </div>
      </div>

      {/* Privacy & Architecture Notice Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-800 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Privacy-First AI Architecture:</strong> Financial calculations are verified deterministically. Passwords, tokens, and raw PII are never transmitted to AI models.
          </span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isDemoMode ? 'Demo Ledger Active' : 'Authenticated Ledger Active'}
          </span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto fintech-card p-4 sm:p-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`group relative max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed transition-shadow duration-200 hover:shadow-card ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200/80 shadow-xs'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Copy response"
                    aria-label="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {msg.sender === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <ChatMarkdown content={msg.content} />
                )}

                <div
                  className={`mt-2.5 pt-2 border-t border-slate-200/40 flex items-center justify-between text-[10px] ${
                    msg.sender === 'user' ? 'text-slate-400 border-slate-800' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'assistant' && (
                    <span className="font-mono flex items-center gap-1">
                      {msg.source === 'openai' ? (
                        <span className="text-emerald-700 font-semibold">🟢 OpenAI GPT-4o-mini (Edge)</span>
                      ) : (
                        <span className="text-slate-600 font-medium">⚡ SmartPaisa Deterministic Engine</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 shadow-sm animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 text-xs text-slate-500 border border-slate-200/60 flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" />
              </div>
              <span className="font-medium text-slate-600">
                Running financial calculations...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="shrink-0 space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          Quick Financial Queries:
        </p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SUGGESTED_QUESTIONS.map((sug) => {
            const Icon = sug.icon;
            return (
              <button
                key={sug.text}
                type="button"
                onClick={() => handleSendMessage(sug.text)}
                disabled={loading}
                className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/30 text-xs font-medium transition-colors shadow-soft shrink-0 disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-emerald-600" />
                <span>{sug.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Field & Send Button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 shrink-0 pb-1"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask: 'Can I afford a ₹2,000 purchase this week?', 'Compare this month with last month'..."
          disabled={loading}
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-soft transition-all"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!inputPrompt.trim() || loading}
          loading={loading}
          icon={<Send className="w-4 h-4" />}
          className="rounded-2xl px-5 py-3"
        >
          Send
        </Button>
      </form>
    </div>
  );
};
