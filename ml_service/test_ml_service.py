"""
Test Suite for SmartPaisa 2.0 FastAPI ML Service
Compatible with both `pytest` (FastAPI TestClient) and standalone `python ml_service/test_ml_service.py`.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from categorization import predict_expense_category, save_user_correction
from forecasting import compute_forecast
from anomaly_detection import detect_expense_anomalies
from budget_recommendation import generate_budget_recommendations
from health_score import compute_financial_health_score


def test_predict_category_merchant_and_feedback():
    res = predict_expense_category("Swiggy ₹245 Order")
    assert res["category"] == "Food & Dining"
    assert res["confidence"] >= 0.9

    save_user_correction("Campus Lab Kit", "Education")
    res2 = predict_expense_category("Campus Lab Kit")
    assert res2["category"] == "Education"
    assert res2["confidence"] == 0.99


def test_forecast_and_empty_handling():
    empty_res = compute_forecast([], 10000, 11, 2026)
    assert empty_res["month_end"]["insufficient_data"] is True

    sample_expenses = [
        {"title": "Mess", "amount": 250, "category": "Food & Dining", "expense_date": "2026-11-01"},
        {"title": "Metro", "amount": 150, "category": "Transport", "expense_date": "2026-11-02"},
        {"title": "Books", "amount": 400, "category": "Education", "expense_date": "2026-11-03"},
        {"title": "Groceries", "amount": 320, "category": "Groceries", "expense_date": "2026-11-04"},
    ]
    res = compute_forecast(sample_expenses, 12000, 11, 2026)
    assert res["month_end"]["expected_amount"] >= sum(x["amount"] for x in sample_expenses)
    assert res["month_end"]["mae"] > 0


def test_anomaly_detection_never_labels_fraud():
    expenses = [
        {"title": "Chai", "amount": 40, "category": "Food & Dining", "expense_date": "2026-11-01"},
        {"title": "Lunch", "amount": 120, "category": "Food & Dining", "expense_date": "2026-11-02"},
        {"title": "Auto", "amount": 80, "category": "Transport", "expense_date": "2026-11-03"},
        {"title": "Snack", "amount": 60, "category": "Food & Dining", "expense_date": "2026-11-04"},
        {"title": "Luxury Watch", "amount": 9500, "category": "Shopping", "expense_date": "2026-11-05"},
    ]
    items = detect_expense_anomalies(expenses)
    flagged = [x for x in items if x["is_anomaly"]]
    assert len(flagged) >= 1
    assert "fraud" not in flagged[0]["explanation"].lower()


def test_budget_recommendations_and_health_score():
    expenses = [
        {"title": "Swiggy", "amount": 4200, "category": "Food & Dining", "expense_date": "2026-11-01"},
        {"title": "Metro", "amount": 900, "category": "Transport", "expense_date": "2026-11-02"},
    ]
    recs = generate_budget_recommendations(expenses, 10000)
    assert len(recs) == 2
    assert recs[0]["potential_savings"] > 0

    score = compute_financial_health_score(
        total_expenses=6000,
        monthly_budget=10000,
        total_income=12000,
        daily_average=200,
        days_in_month=30,
        days_elapsed=20,
        goal_progress_ratio=0.6,
    )
    assert 0 <= score["overall_score"] <= 100
    assert score["grade"] in ("Excellent", "Good", "Fair", "Needs Attention")


if __name__ == "__main__":
    test_predict_category_merchant_and_feedback()
    test_forecast_and_empty_handling()
    test_anomaly_detection_never_labels_fraud()
    test_budget_recommendations_and_health_score()
    print("ALL 4 PYTHON ML MODULE SUITES PASSED SUCCESSFULLY!")
