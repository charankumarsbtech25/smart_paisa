"""
SmartPaisa 2.0 - Intelligent Expense Categorization Module (categorization.py)
Implements:
1. Layer 1: Deterministic Indian Merchant & Keyword Rule Engine
2. Layer 2: Scikit-Learn TF-IDF + Logistic Regression / Linear SVM Classifier
3. Layer 3: Configurable confidence threshold & user feedback adaptation
"""

import logging
from typing import Dict, Tuple, Optional

logger = logging.getLogger("smartpaisa.categorization")

MODEL_VERSION = "categorizer-tfidf-logreg-v2.0.0"

MERCHANT_RULES: Dict[str, Tuple[str, str, float]] = {
    "swiggy": ("Food & Dining", "Food Delivery", 0.96),
    "zomato": ("Food & Dining", "Food Delivery", 0.96),
    "canteen": ("Food & Dining", "Campus Dining", 0.92),
    "chai": ("Food & Dining", "Tea & Snacks", 0.90),
    "domino": ("Food & Dining", "Restaurants", 0.95),
    "starbucks": ("Food & Dining", "Cafes", 0.94),
    "blinkit": ("Groceries", "Quick Commerce Groceries", 0.94),
    "zepto": ("Groceries", "Quick Commerce Groceries", 0.94),
    "bigbasket": ("Groceries", "Supermarket & Ration", 0.95),
    "dmart": ("Groceries", "Supermarket & Ration", 0.94),
    "grocery": ("Groceries", "Daily Essentials", 0.91),
    "uber": ("Transport", "Ride Hailing", 0.95),
    "ola": ("Transport", "Ride Hailing", 0.95),
    "rapido": ("Transport", "Bike Taxi", 0.93),
    "metro": ("Transport", "Public Transit", 0.94),
    "dmrc": ("Transport", "Metro Commute", 0.94),
    "irctc": ("Transport", "Railways", 0.95),
    "petrol": ("Transport", "Fuel", 0.92),
    "rent": ("Rent", "Housing & Hostel Rent", 0.96),
    "hostel": ("Rent", "Hostel Accommodation", 0.94),
    "pg ": ("Rent", "PG Accommodation", 0.92),
    "book": ("Education", "Books & Study", 0.93),
    "xerox": ("Education", "Printing & Binding", 0.92),
    "udemy": ("Education", "Online Courses", 0.95),
    "coursera": ("Education", "Online Courses", 0.95),
    "tuition": ("Education", "Tuition & Coaching", 0.95),
    "jio": ("Bills & Recharge", "Mobile Recharge", 0.96),
    "airtel": ("Bills & Recharge", "Telecom & Broadband", 0.95),
    "electricity": ("Bills & Recharge", "Electricity Bill", 0.95),
    "wifi": ("Bills & Recharge", "Internet & WiFi", 0.93),
    "amazon": ("Shopping", "E-Commerce", 0.92),
    "flipkart": ("Shopping", "E-Commerce", 0.92),
    "myntra": ("Shopping", "Apparel & Fashion", 0.93),
    "nykaa": ("Shopping", "Lifestyle Retail", 0.91),
    "netflix": ("Subscriptions", "OTT Subscription", 0.95),
    "spotify": ("Subscriptions", "Music Subscription", 0.95),
    "chatgpt": ("Subscriptions", "AI & SaaS Subscription", 0.95),
    "youtube premium": ("Subscriptions", "OTT Subscription", 0.95),
    "bookmyshow": ("Entertainment", "Movies & Events", 0.94),
    "pvr": ("Entertainment", "Cinema", 0.94),
    "apollo": ("Health", "Pharmacy & Medicine", 0.94),
    "pharmeasy": ("Health", "Online Medicine", 0.94),
    "1mg": ("Health", "Medical & Diagnostics", 0.94),
    "doctor": ("Health", "Doctor Consultation", 0.92),
    "gym": ("Personal Care", "Fitness & Gym", 0.93),
    "salon": ("Personal Care", "Salon & Grooming", 0.92),
}

# In-memory user correction store (persisted in Supabase `user_feedback` in production)
USER_CORRECTIONS: Dict[str, str] = {}

# Try building a lightweight scikit-learn TF-IDF + LogisticRegression pipeline
_SKLEARN_PIPELINE = None

def _init_sklearn_model():
    global _SKLEARN_PIPELINE
    if _SKLEARN_PIPELINE is not None:
        return _SKLEARN_PIPELINE
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.linear_model import LogisticRegression
        from sklearn.pipeline import Pipeline

        corpus = [
            ("swiggy food delivery dinner biryani lunch", "Food & Dining"),
            ("zomato restaurant burger pizza cafe", "Food & Dining"),
            ("blinkit zepto groceries milk vegetables bread", "Groceries"),
            ("bigbasket dmart supermarket ration atta", "Groceries"),
            ("uber ola auto cab ride metro train ticket", "Transport"),
            ("petrol fuel bus pass airport commute", "Transport"),
            ("monthly flat rent hostel fee pg landlord", "Rent"),
            ("college tuition किताब textbook course exam udemy", "Education"),
            ("amazon flipkart myntra clothes shoes electronics", "Shopping"),
            ("pvr movie cinema concert gaming bowling", "Entertainment"),
            ("jio airtel recharge electricity wifi broadband bill", "Bills & Recharge"),
            ("netflix spotify prime membership subscription renewal", "Subscriptions"),
            ("apollo pharmacy medicine doctor hospital clinic", "Health"),
            ("gym fitness salon haircut skincare grooming", "Personal Care"),
        ]
        texts = [t for t, _ in corpus]
        labels = [c for _, c in corpus]

        pipe = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
            ("clf", LogisticRegression(C=2.0, max_iter=200)),
        ])
        pipe.fit(texts, labels)
        _SKLEARN_PIPELINE = pipe
    except Exception as exc:
        logger.warning("Scikit-learn pipeline unavailable, using rule fallback: %s", exc)
        _SKLEARN_PIPELINE = False
    return _SKLEARN_PIPELINE


def save_user_correction(description: str, corrected_category: str) -> None:
    clean = (description or "").strip().lower()
    if clean:
        USER_CORRECTIONS[clean] = corrected_category


def predict_expense_category(
    description: str,
    merchant: Optional[str] = None,
    amount: Optional[float] = None,
    confidence_threshold: float = 0.75,
) -> Dict[str, object]:
    combined = f"{merchant or ''} {description or ''}".strip().lower()

    # Layer 0: User-confirmed feedback memory
    if combined in USER_CORRECTIONS:
        cat = USER_CORRECTIONS[combined]
        return {
            "category": cat,
            "subcategory": "User Confirmed Rule",
            "confidence": 0.99,
            "source": "user_feedback",
            "suggested_action": "accept",
            "model_version": MODEL_VERSION,
        }

    # Layer 1: Deterministic Merchant & Keyword Rule Engine
    for kw, (cat, subcat, conf) in MERCHANT_RULES.items():
        if kw in combined:
            return {
                "category": cat,
                "subcategory": subcat,
                "confidence": conf,
                "source": "merchant_lookup",
                "suggested_action": "accept" if conf >= confidence_threshold else "confirm_prompt",
                "model_version": MODEL_VERSION,
            }

    # Layer 2: Scikit-Learn TF-IDF + Logistic Regression
    pipe = _init_sklearn_model()
    if pipe:
        try:
            probs = pipe.predict_proba([combined])[0]
            classes = pipe.classes_
            best_idx = int(probs.argmax())
            best_cat = str(classes[best_idx])
            best_conf = round(float(probs[best_idx]), 2)
            if best_conf >= 0.18:
                calibrated = min(0.90, round(0.55 + best_conf * 0.45, 2))
                return {
                    "category": best_cat,
                    "subcategory": f"{best_cat} (TF-IDF Classifier)",
                    "confidence": calibrated,
                    "source": "tfidf_logreg",
                    "suggested_action": "accept" if calibrated >= confidence_threshold else "confirm_prompt",
                    "model_version": MODEL_VERSION,
                }
        except Exception as exc:
            logger.debug("TF-IDF prediction fallback: %s", exc)

    return {
        "category": "Other",
        "subcategory": "General Expense",
        "confidence": 0.45,
        "source": "rule_engine",
        "suggested_action": "confirm_prompt",
        "model_version": MODEL_VERSION,
    }
