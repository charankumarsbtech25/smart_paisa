"""
SmartPaisa 2.0 - Smart Budget Recommendation & Health Score Module
(budget_recommendation.py & health_score.py)
"""

from typing import List, Dict, Any, Optional


def generate_budget_recommendations(
    expenses: List[Dict[str, Any]],
    total_budget: float,
) -> List[Dict[str, Any]]:
    if not expenses:
        return []

    cat_totals: Dict[str, float] = {}
    for e in expenses:
        cat = str(e.get("category", "Other"))
        cat_totals[cat] = cat_totals.get(cat, 0.0) + float(e.get("amount", 0.0))

    total_spent = sum(cat_totals.values()) or 1.0
    recs = []

    for cat, spent in cat_totals.items():
        if spent <= 0:
            continue
        share = spent / total_spent
        if cat in ("Food & Dining", "Shopping", "Entertainment", "Subscriptions") and share > 0.18:
            rec_amt = round(spent * 0.82)
            trend = "increasing"
            reason = (
                f"{cat} accounts for {round(share * 100)}% of total spend. Trimming discretionary "
                f"orders by 18% saves ₹{round(spent - rec_amt)}/month."
            )
        else:
            rec_amt = round(spent * 0.94)
            trend = "stable"
            reason = f"{cat} spending ({round(share * 100)}% of total) is within balanced limits."

        recs.append({
            "category": cat,
            "current_average": round(spent, 2),
            "recommended_budget": max(100.0, float(rec_amt)),
            "potential_savings": max(0.0, round(spent - rec_amt, 2)),
            "trend": trend,
            "reasoning": reason,
        })

    return sorted(recs, key=lambda x: x["potential_savings"], reverse=True)


def compute_financial_health_score(
    total_expenses: float,
    monthly_budget: float,
    total_income: Optional[float] = 0.0,
    daily_average: float = 0.0,
    days_in_month: int = 30,
    days_elapsed: int = 15,
    goal_progress_ratio: Optional[float] = 0.0,
) -> Dict[str, Any]:
    suggestions: List[str] = []

    # 1. Budget adherence (30%)
    budget_pts = 30
    if monthly_budget > 0:
        if total_expenses > monthly_budget:
            budget_pts = max(0, 30 - int(((total_expenses - monthly_budget) / monthly_budget) * 50))
            suggestions.append("Monthly budget exceeded. Pause non-essential purchases.")
        elif total_expenses >= monthly_budget * 0.8:
            budget_pts = 20
            suggestions.append("Budget usage crossed 80%. Stick to your safe daily allowance.")
    else:
        budget_pts = 20
        suggestions.append("Set a monthly budget to unlock the full 30-point budget adherence score.")

    # 2. Savings consistency (25%) — Relative percentage, never penalizing low student income
    savings_pts = 18
    if total_income and total_income > 0:
        rate = ((total_income - total_expenses) / total_income) * 100.0
        if rate >= 20:
            savings_pts = 25
        elif rate >= 10:
            savings_pts = 18
            suggestions.append(f"Savings rate is {round(rate)}%. Aim for 20% under the 50/30/20 rule.")
        else:
            savings_pts = 10
            suggestions.append("Savings rate is below 10%. Review recurring wants.")
    elif monthly_budget > total_expenses and monthly_budget > 0:
        savings_pts = max(12, min(25, int(((monthly_budget - total_expenses) / monthly_budget) * 25)))

    # 3. Expense consistency / velocity (20%)
    velocity_pts = 20
    ideal_daily = monthly_budget / max(1, days_in_month) if monthly_budget > 0 else 0.0
    if ideal_daily > 0 and daily_average > ideal_daily * 1.25:
        velocity_pts = 10
        suggestions.append("Daily spending velocity exceeds your ideal daily budget benchmark.")

    # 4. Emergency savings progress (15%)
    net_cushion = (total_income or monthly_budget) - total_expenses
    emerg_pts = 15 if net_cushion >= 2000 else (12 if net_cushion >= 0 else 5)
    if emerg_pts <= 5:
        suggestions.append("Build an emergency buffer of at least ₹2,000–₹5,000.")

    # 5. Savings goal progress (10%)
    goal_pts = min(10, max(4, int((goal_progress_ratio or 0.5) * 10)))

    overall = min(100, max(0, budget_pts + savings_pts + velocity_pts + emerg_pts + goal_pts))
    grade = (
        "Excellent"
        if overall >= 80
        else "Good"
        if overall >= 65
        else "Fair"
        if overall >= 50
        else "Needs Attention"
    )

    if not suggestions:
        suggestions.append("Great financial discipline! Your spending and savings are well balanced.")

    return {
        "overall_score": overall,
        "budget_adherence": budget_pts,
        "savings_consistency": savings_pts,
        "expense_velocity": velocity_pts,
        "emergency_fund": emerg_pts,
        "goal_progress": goal_pts,
        "grade": grade,
        "suggestions": suggestions[:3],
    }
