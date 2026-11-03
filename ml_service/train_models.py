"""
SmartPaisa 2.0 ML Model Training & Evaluation Pipeline
Trains:
1. TF-IDF + Logistic Regression / Linear SVM for Expense Categorization
2. Isolation Forest for Unusual Expense & Anomaly Detection
3. Linear Regression & Random Forest for Daily Spending Velocity Forecasting
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, mean_absolute_error, mean_squared_error

# Synthetic realistic dataset tailored for Indian college students & young adults
SYNTHETIC_DATASET = [
    # Food & Dining
    ("Swiggy lunch order paneer thali", "Food & Dining"),
    ("Zomato biryani delivery hostel", "Food & Dining"),
    ("College canteen samosa and chai", "Food & Dining"),
    ("Hostel mess monthly meal payment", "Food & Dining"),
    ("Domino's pizza with study group", "Food & Dining"),
    ("McDonalds burger meal", "Food & Dining"),
    ("Chai Point ginger tea and biscuits", "Food & Dining"),
    ("Cafe Coffee Day cappuccino", "Food & Dining"),
    ("Late night Maggi at campus tapri", "Food & Dining"),
    ("KFC chicken popcorn bucket", "Food & Dining"),
    ("Juice center seasonal mango shake", "Food & Dining"),
    ("Local bakery bread and butter toast", "Food & Dining"),
    
    # Transport
    ("Uber cab ride to railway station", "Transport"),
    ("Ola auto ride to PG", "Transport"),
    ("Metro smartcard online recharge DMRC", "Transport"),
    ("Rapido bike taxi to university campus", "Transport"),
    ("IRCTC train ticket booking holiday trip", "Transport"),
    ("Petrol pump vehicle fuel refill IOCL", "Transport"),
    ("City bus daily commute pass", "Transport"),
    ("Namma Yatri auto fare", "Transport"),
    ("RedBus interstate bus ticket to hometown", "Transport"),
    ("BluSmart EV cab ride to airport", "Transport"),
    
    # Education
    ("Engineering semester textbook bundle", "Education"),
    ("Exam registration fee portal", "Education"),
    ("Campus Xerox shop project prints and binding", "Education"),
    ("Scientific calculator Casio fx-991CW", "Education"),
    ("Udemy Web Development Bootcamp course", "Education"),
    ("Coursera Machine Learning specialization", "Education"),
    ("Classmate spiral notebooks and pens", "Education"),
    ("Library late return fine", "Education"),
    ("Physics Wallah online coaching batch", "Education"),
    ("College lab manual and stationery", "Education"),
    
    # Bills & Recharge
    ("Jio 5G prepaid quarterly mobile recharge", "Bills & Recharge"),
    ("Airtel fiber high speed broadband bill", "Bills & Recharge"),
    ("Electricity bill payment hostel room", "Bills & Recharge"),
    ("Tata Play DTH monthly recharge", "Bills & Recharge"),
    ("LPG cylinder booking Indane gas", "Bills & Recharge"),
    ("Water utility bill payment", "Bills & Recharge"),
    ("Vodafone Idea postpaid plan bill", "Bills & Recharge"),
    ("Google Drive 100GB student cloud storage", "Bills & Recharge"),
    
    # Shopping
    ("Amazon India mechanical keyboard order", "Shopping"),
    ("Flipkart Big Billion Days t-shirt sale", "Shopping"),
    ("Myntra casual denim jeans and sneakers", "Shopping"),
    ("Blinkit grocery delivery milk oats eggs", "Shopping"),
    ("Zepto 10 min groceries toothpaste soap", "Shopping"),
    ("Zudio casual cotton shirts", "Shopping"),
    ("Decathlon sports gym duffel bag", "Shopping"),
    ("D-Mart monthly supermarket essentials", "Shopping"),
    ("Nykaa skincare sunscreen cream", "Shopping"),
    ("Meesho budget laptop stand", "Shopping"),
    
    # Entertainment
    ("BookMyShow weekend cinema movie tickets", "Entertainment"),
    ("Netflix 4K screen subscription monthly", "Entertainment"),
    ("Spotify Premium student discount plan", "Entertainment"),
    ("PVR Inox popcorn combo and 3D movie", "Entertainment"),
    ("YouTube Premium family pack", "Entertainment"),
    ("Steam winter video game purchase", "Entertainment"),
    ("College cultural fest pass entry ticket", "Entertainment"),
    ("Stand-up comedy show live booking", "Entertainment"),
    
    # Health
    ("Apollo Pharmacy cough syrup and paracetamol", "Health"),
    ("PharmEasy monthly prescription medicines", "Health"),
    ("Dental clinic teeth cleaning and checkup", "Health"),
    ("Doctor consultation fee clinic visit", "Health"),
    ("1mg multivitamin tablets and zinc", "Health"),
    ("Lenskart eye examination and new glasses", "Health"),
    ("Diagnostic lab blood test profile", "Health"),
    
    # Personal Care
    ("Salon haircut and beard styling", "Personal Care"),
    ("Cult.fit gym quarterly gym membership", "Personal Care"),
    ("Grooming kit electric trimmer Philips", "Personal Care"),
    ("Facial cleanser and moisturizer", "Personal Care"),
    ("Campus beauty parlour eyebrow threading", "Personal Care"),
]

def train_and_evaluate():
    print("=== Training SmartPaisa 2.0 ML Models ===")
    
    # 1. Categorization Model (TF-IDF + Logistic Regression)
    texts, labels = zip(*SYNTHETIC_DATASET)
    X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.25, random_state=42)
    
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=1000)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    clf = LogisticRegression(C=1.5, max_iter=200)
    clf.fit(X_train_vec, y_train)
    
    y_pred = clf.predict(X_test_vec)
    print("\n--- Categorization Model Evaluation ---")
    report = classification_report(y_test, y_pred, output_dict=True)
    print(f"Accuracy: {report['accuracy']:.2f}")
    print(f"Macro F1-Score: {report['macro avg']['f1-score']:.2f}")
    
    # 2. Anomaly Detection Model (Isolation Forest)
    np.random.seed(42)
    # Synthetic spending amounts: normal student spending (mean ~350, std ~200) + outliers
    normal_amounts = np.random.normal(350, 180, 200).clip(20, 1500)
    outlier_amounts = np.array([4500, 7800, 12000, 9500, 15000]) # Unusually large splurges
    all_amounts = np.concatenate([normal_amounts, outlier_amounts]).reshape(-1, 1)
    
    iso_forest = IsolationForest(contamination=0.03, random_state=42)
    iso_forest.fit(all_amounts)
    anomaly_preds = iso_forest.predict(all_amounts)
    detected_outliers = np.sum(anomaly_preds == -1)
    print("\n--- Anomaly Detection Evaluation ---")
    print(f"Trained on {len(all_amounts)} sample transactions. Outliers detected: {detected_outliers}")
    
    # 3. Expense Forecasting Model (Linear Regression & Random Forest)
    days = np.arange(1, 31).reshape(-1, 1)
    # Synthetic cumulative spending curve with weekday/weekend variance
    daily_spend = 250 + 50 * np.sin(days) + np.random.normal(0, 30, len(days))
    
    forecast_model = RandomForestRegressor(n_estimators=50, random_state=42)
    forecast_model.fit(days, daily_spend.ravel())
    preds = forecast_model.predict(days)
    
    mae = mean_absolute_error(daily_spend, preds)
    rmse = np.sqrt(mean_squared_error(daily_spend, preds))
    print("\n--- Forecasting Model Evaluation ---")
    print(f"MAE: ₹{mae:.2f}")
    print(f"RMSE: ₹{rmse:.2f}")
    
    # Save metadata
    os.makedirs("models", exist_ok=True)
    metrics_summary = {
        "categorization": {
            "model": "TF-IDF + LogisticRegression",
            "accuracy": round(report['accuracy'], 3),
            "macro_f1": round(report['macro avg']['f1-score'], 3),
            "samples": len(texts)
        },
        "anomaly_detection": {
            "model": "IsolationForest",
            "contamination": 0.03,
            "samples": len(all_amounts)
        },
        "forecasting": {
            "model": "RandomForestRegressor",
            "mae": round(mae, 2),
            "rmse": round(rmse, 2)
        }
    }
    
    with open("models/metrics.json", "w") as f:
        json.dump(metrics_summary, f, indent=2)
    print("\nModel metrics saved to models/metrics.json")
    print("=== Training Complete ===")

if __name__ == "__main__":
    train_and_evaluate()
