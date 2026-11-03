"""
SmartPaisa 2.0 - Explainable Financial Health Score Module (health_score.py)
Re-exports `compute_financial_health_score` with configurable component weights:
- Budget adherence: 30%
- Savings consistency: 25%
- Expense consistency: 20%
- Emergency savings progress: 15%
- Savings goal progress: 10%
"""

from budget_recommendation import compute_financial_health_score

__all__ = ["compute_financial_health_score"]
