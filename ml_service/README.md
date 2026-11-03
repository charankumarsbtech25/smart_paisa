# SmartPaisa 2.0 — Machine Learning Microservice

FastAPI-powered machine learning inference and training microservice for SmartPaisa 2.0.

## 🚀 Capabilities

1. **TF-IDF + Classification**: Automatically categorizes raw transaction descriptions and Indian merchant names (Swiggy, Zomato, IRCTC, DMRC, Jio, Blinkit, etc.) with confidence scores and subcategory tags.
2. **Time-Series Expense Forecasting**: Generates multi-horizon forecasts (7-day, 30-day, and month-end) with 95% confidence intervals, MAE, and RMSE metrics.
3. **Anomaly & Outlier Detection**: Flags statistically anomalous charges via Isolation Forest and rolling Z-score.
4. **Smart Budget Recommendation Optimizer**: Computes category-level budget allocations and potential savings without violating user constraints.
5. **Financial Health Scoring**: Calculates an explainable 0–100 score across 5 weighted dimensions.

## 🛠️ Local Development & Running

### 1. Create Virtual Environment & Install Dependencies
```bash
cd ml_service
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Train Models on Synthetic Dataset
```bash
python train_models.py
```
This evaluates the models, outputs Macro F1, Accuracy, MAE, and RMSE, and saves metrics to `models/metrics.json`.

### 3. Start the FastAPI Server
```bash
uvicorn main:app --reload --port 8000
```
Interactive API documentation will be available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 🌐 Dual-Mode Fallback
If this service is not running locally, the SmartPaisa React frontend automatically and seamlessly engages its client-side mathematical equivalent (`src/utils/mlEngine.ts`), ensuring 100% functionality with zero downtime.
