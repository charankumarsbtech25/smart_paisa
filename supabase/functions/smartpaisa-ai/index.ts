// Supabase Edge Function: smartpaisa-ai
// Secure server-side AI Financial Assistant for SmartPaisa 2.0
// Verifies user JWT, retrieves ONLY that user's aggregated financial metrics via RLS,
// sanitizes prompts against injection, and communicates with OpenAI GPT-4o-mini.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface RequestPayload {
  message: string;
  month?: number;
  year?: number;
  mode?: "chat" | "summary";
  history?: ChatTurn[];
  deterministicCalculation?: string;
}

function sanitizePrompt(raw: string): { clean: string; blocked: boolean } {
  const trimmed = (raw || "").trim().slice(0, 600);
  const blockedPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
    /reveal\s+(your|the)\s+(api\s*key|secret|token|password|system\s*instructions)/i,
    /disregard\s+all\s+safety/i,
  ];
  for (const pat of blockedPatterns) {
    if (pat.test(trimmed)) {
      return { clean: "[BLOCKED_PROMPT_INJECTION]", blocked: true };
    }
  }
  return {
    clean: trimmed
      .replace(/\b(?:\d[ -]*?){13,16}\b/g, "[REDACTED_CARD]")
      .replace(/\bsk-[a-zA-Z0-9]{20,}\b/g, "[REDACTED_KEY]"),
    blocked: false,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const body: RequestPayload = await req.json();
    const { clean: userPrompt, blocked } = sanitizePrompt(body.message || "");

    if (blocked) {
      return new Response(
        JSON.stringify({
          source: "security-guardrail",
          reply: "### 🛡️ Security Guardrail Active\n\nPrompt injection or system instruction override attempt blocked. Please ask a standard personal finance question.",
          configured: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentMonth = body.month || (new Date().getMonth() + 1);
    const currentYear = body.year || new Date().getFullYear();

    if (!userPrompt && body.mode !== "summary") {
      return new Response(JSON.stringify({ error: "Query message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch strictly aggregated financial data for this authenticated user (RLS enforced)
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(prevLastDay).padStart(2, "0")}`;

    const [currExpensesRes, prevExpensesRes, budgetRes, goalsRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("amount, category, expense_date")
        .eq("user_id", userId)
        .gte("expense_date", startDate)
        .lte("expense_date", endDate)
        .limit(300),
      supabase
        .from("expenses")
        .select("amount, category")
        .eq("user_id", userId)
        .gte("expense_date", prevStartDate)
        .lte("expense_date", prevEndDate)
        .limit(300),
      supabase
        .from("monthly_budgets")
        .select("amount")
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .maybeSingle(),
      supabase
        .from("savings_goals")
        .select("title, target_amount, saved_amount, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(20),
    ]);

    const currExpenses = currExpensesRes.data || [];
    const prevExpenses = prevExpensesRes.data || [];
    const monthlyBudget = budgetRes.data?.amount ? Number(budgetRes.data.amount) : 0;
    const activeGoals = goalsRes.data || [];

    const currentTotal = currExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const prevTotal = prevExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const remainingBudget = monthlyBudget > 0 ? monthlyBudget - currentTotal : null;
    const budgetUtilizationPct = monthlyBudget > 0 ? Math.round((currentTotal / monthlyBudget) * 100) : null;

    const categoryTotals: Record<string, number> = {};
    for (const exp of currExpenses) {
      const cat = exp.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount);
    }

    const sortedCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const daysElapsed = Math.min(new Date().getDate(), lastDay);
    const dailyAverage = daysElapsed > 0 ? Number((currentTotal / daysElapsed).toFixed(1)) : 0;
    const projectedEndOfMonth = Math.round(currentTotal + dailyAverage * Math.max(0, lastDay - daysElapsed));

    // Minimum required aggregated context (Zero PII, Zero tokens/passwords)
    const aggregatedFinancialContext = {
      period: `${currentMonth}/${currentYear}`,
      totalSpentINR: currentTotal,
      monthlyBudgetINR: monthlyBudget,
      remainingBudgetINR: remainingBudget,
      budgetUtilizationPercent: budgetUtilizationPct,
      dailyAverageSpentINR: dailyAverage,
      projectedEndOfMonthINR: projectedEndOfMonth,
      previousMonthTotalINR: prevTotal,
      monthOverMonthDiffINR: currentTotal - prevTotal,
      topCategories: sortedCategories.slice(0, 6),
      activeSavingsGoalsCount: activeGoals.length,
      transactionCount: currExpenses.length,
    };

    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      return new Response(
        JSON.stringify({
          source: "smartpaisa-rule-engine",
          reply: body.deterministicCalculation || "Deterministic calculation engine active.",
          financialContext: aggregatedFinancialContext,
          configured: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are SmartPaisa 2.0 AI, a financial assistant for Indian users.
All currency values are in Indian Rupees (₹/INR).
CRITICAL ARCHITECTURAL RULES:
1. NEVER invent or fabricate account balances, transaction totals, or forecasts.
2. Use ONLY the verified deterministic numbers from the aggregated context below:
${JSON.stringify(aggregatedFinancialContext, null, 2)}
${body.deterministicCalculation ? `\nPre-verified deterministic calculation reference:\n${body.deterministicCalculation}` : ""}
3. Explain calculations clearly, support follow-up questions, handle insufficient data honestly, and include a brief educational disclaimer.`;

    const recentMessages = Array.isArray(body.history)
      ? body.history.slice(-6).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "").slice(0, 350),
        }))
      : [];

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages,
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 750,
      }),
    });

    if (openAiResponse.ok) {
      const aiData = await openAiResponse.json();
      const replyContent = aiData.choices?.[0]?.message?.content || body.deterministicCalculation || "";
      return new Response(
        JSON.stringify({
          source: "openai",
          reply: replyContent,
          financialContext: aggregatedFinancialContext,
          configured: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        source: "smartpaisa-rule-engine-fallback",
        reply: body.deterministicCalculation || "Unable to reach OpenAI service; using deterministic financial calculation engine.",
        financialContext: aggregatedFinancialContext,
        configured: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("SmartPaisa AI function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
