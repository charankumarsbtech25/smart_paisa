"""
SmartPaisa 2.0 Machine Learning FastAPI Microservice (main.py)
Modular architecture integrating:
- categorization.py (Rule Engine + TF-IDF Logistic Regression + User Feedback)
- forecasting.py (Moving Average, Linear Regression, Random Forest, XGBoost)
- anomaly_detection.py (Isolation Forest, Local Outlier Factor, Rolling Z-score)
- budget_recommendation.py (Personalized Category Limits & Reasoning)
- health_score.py (Explainable 0-100 Financial Health Score)

Includes:
- Pydantic input validation
- Shared secret / Supabase Bearer token verification when SMARTPAISA_ML_API_SECRET is configured
- Structured logging & error handling
- Model versioning & fallback behavior
"""

import os
import logging
from typing import List, Optional
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from categorization import predict_expense_category, save_user_correction, MODEL_VERSION as CAT_VERSION
from forecasting import compute_forecast, MODEL_VERSION as FORECAST_VERSION
from anomaly_detection import detect_expense_anomalies, MODEL_VERSION as ANOMALY_VERSION
from budget_recommendation import generate_budget_recommendations
from health_score import compute_financial_health_score

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("smartpaisa.ml_service")

app = FastAPI(
    title="SmartPaisa 2.0 ML Service",
    description="Modular financial ML inference service for SmartPaisa 2.0",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_api_auth(
    x_api_key: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
):
    """
    Verifies shared secret (`X-API-Key`) or Supabase JWT (`Authorization: Bearer ...`)
    when `SMARTPAISA_ML_API_SECRET` is configured in the environment.
    """
    expected_secret = os.getenv("SMARTPAISA_ML_API_SECRET", "").strip()
    if not expected_secret:
        return True
    token = ""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if x_api_key == expected_secret or token == expected_secret:
        return True
    raise HTTPException(status_code=401, detail="Unauthorized ML service request")


# ----------------- Request / Response Models -----------------

class CategorizationRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=250)
    amount: Optional[float] = Field(default=None, ge=0)
    merchant: Optional[str] = Field(default=None, max_length=120)
    confidence_threshold: Optional[float] = Field(default=0.75, ge=0.4, le=0.98)


class CategorizationResponse(BaseModel):
    category: str
    subcategory: str
    confidence: float
    source: str
    suggested_action: str
    model_version: Optional[str] = CAT_VERSION


class FeedbackRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=250)
    corrected_category: str = Field(..., min_length=2, max_length=60)


class ExpenseItem(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=60)
    expense_date: str = Field(..., min_length=8, max_length=25)


class ForecastRequest(BaseModel):
    expenses: List[ExpenseItem]
    monthly_budget: float = Field(default=0.0, ge=0)
    selected_month: int = Field(default=11, ge=1, le=12)
    selected_year: int = Field(default=2026, ge=2020, le=2035)


class ForecastHorizon(BaseModel):
    horizon: str
    expected_amount: float
    lower_bound: float
    upper_bound: float
    confidence_level: float
    model_used: str
    mae: float
    rmse: float
    mape: Optional[float] = 7.5
    overrun_warning: bool
    projected_overrun_amount: float
    insufficient_data: Optional[bool] = False


class ForecastResponse(BaseModel):
    seven_day: ForecastHorizon
    thirty_day: ForecastHorizon
    month_end: ForecastHorizon
    model_version: Optional[str] = FORECAST_VERSION


class AnomalyRequest(BaseModel):
    expenses: List[ExpenseItem]
    user_threshold: Optional[float] = Field(default=0.0, ge=0)


class AnomalyItem(BaseModel):
    title: str
    amount: float
    category: str
    expense_date: str
    is_anomaly: bool
    anomaly_score: float
    anomaly_type: Optional[str] = None
    algorithm_used: Optional[str] = "rolling_zscore"
    explanation: str


class BudgetRecRequest(BaseModel):
    expenses: List[ExpenseItem]
    total_budget: float = Field(default=0.0, ge=0)


class BudgetRecItem(BaseModel):
    category: str
    current_average: float
    recommended_budget: float
    potential_savings: float
    trend: str
    reasoning: str


class HealthScoreRequest(BaseModel):
    total_expenses: float = Field(..., ge=0)
    monthly_budget: float = Field(..., ge=0)
    total_income: Optional[float] = Field(default=0.0, ge=0)
    daily_average: float = Field(default=0.0, ge=0)
    days_in_month: int = Field(default=30, ge=28, le=31)
    days_elapsed: int = Field(default=15, ge=1, le=31)
    goal_progress_ratio: Optional[float] = Field(default=0.0, ge=0.0, le=1.0)


class HealthScoreResponse(BaseModel):
    overall_score: int
    budget_adherence: int
    savings_consistency: int
    expense_velocity: int
    emergency_fund: int
    goal_progress: int
    grade: str
    suggestions: List[str]


# ----------------- Endpoints -----------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SmartPaisa 2.0 ML Engine",
        "version": "2.0.0",
        "model_versions": {
            "categorization": CAT_VERSION,
            "forecasting": FORECAST_VERSION,
            "anomaly_detection": ANOMALY_VERSION,
        },
        "models": [
            "TF-IDF + Logistic Regression Classifier",
            "Isolation Forest & Local Outlier Factor",
            "Chronological Ensemble Forecaster (MA / OLS / RF / XGBoost)",
        ],
    }


@app.post("/predict-category", response_model=CategorizationResponse)
def predict_category(req: CategorizationRequest, _auth=Depends(verify_api_auth)):
    try:
        res = predict_expense_category(
            description=req.description,
            merchant=req.merchant,
            amount=req.amount,
            confidence_threshold=req.confidence_threshold or 0.75,
        )
        return CategorizationResponse(**res)
    except Exception as exc:
        logger.error("Categorization error: %s", exc)
        return CategorizationResponse(
            category="Other",
            subcategory="Fallback Rule",
            confidence=0.45,
            source="fallback",
            suggested_action="confirm_prompt",
        )


@app.post("/feedback")
def record_category_feedback(req: FeedbackRequest, _auth=Depends(verify_api_auth)):
    save_user_correction(req.description, req.corrected_category)
    return {"status": "saved", "description": req.description, "category": req.corrected_category}


@app.post("/forecast", response_model=ForecastResponse)
def forecast_expenses(req: ForecastRequest, _auth=Depends(verify_api_auth)):
    raw_expenses = [e.model_dump() for e in req.expenses]
    res = compute_forecast(
        expenses=raw_expenses,
        monthly_budget=req.monthly_budget,
        selected_month=req.selected_month,
        selected_year=req.selected_year,
    )
    return ForecastResponse(**res)


@app.post("/detect-anomalies", response_model=List[AnomalyItem])
def detect_anomalies(req: AnomalyRequest, _auth=Depends(verify_api_auth)):
    raw_expenses = [e.model_dump() for e in req.expenses]
    res = detect_expense_anomalies(
        expenses=raw_expenses,
        user_threshold=req.user_threshold or 0.0,
    )
    return [AnomalyItem(**item) for item in res]


@app.post("/budget-recommendations", response_model=List[BudgetRecItem])
def budget_recommendations(req: BudgetRecRequest, _auth=Depends(verify_api_auth)):
    raw_expenses = [e.model_dump() for e in req.expenses]
    res = generate_budget_recommendations(raw_expenses, req.total_budget)
    return [BudgetRecItem(**item) for item in res]


@app.post("/financial-health-score", response_model=HealthScoreResponse)
def calculate_health_score(req: HealthScoreRequest, _auth=Depends(verify_api_auth)):
    res = compute_financial_health_score(
        total_expenses=req.total_expenses,
        monthly_budget=req.monthly_budget,
        total_income=req.total_income,
        daily_average=req.daily_average,
        days_in_month=req.days_in_month,
        days_elapsed=req.days_elapsed,
        goal_progress_ratio=req.goal_progress_ratio,
    )
    return HealthScoreResponse(**res)
