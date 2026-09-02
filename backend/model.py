"""
model.py
--------
AI Placement Prediction System
Trains a Random Forest Classifier pipeline on the multi-featured student placement dataset.

Features:
    - cgpa: float (0.0 - 10.0)
    - attendance: float (0.0 - 100.0)
    - backlogs: int (>= 0)
    - internships: int (>= 0)
    - projects: int (>= 0)
    - certifications: int (>= 0)
    - aptitude_score: float (0.0 - 100.0)
    - coding_score: float (0.0 - 100.0)
    - technical_skills_score: float (0.0 - 100.0)
    - communication_score: float (0.0 - 100.0)
    - skills_score: float (computed 0.0 - 100.0 from skill strings)
    - branch: categorical (CSE, IT, ECE, EEE, MECH, CIVIL, etc.)

Target:
    - placement: 1 (Placed), 0 (Not Placed)

Artifacts produced:
    - backend/model.pkl
    - backend/accuracy.txt
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

# =========================================================
# 1. FILE PATHS & CONSTANTS
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
ACCURACY_PATH = os.path.join(BASE_DIR, "accuracy.txt")

SKILL_LEVELS = {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3,
}

NUMERIC_FEATURES = [
    "cgpa",
    "attendance",
    "backlogs",
    "internships",
    "projects",
    "certifications",
    "aptitude_score",
    "coding_score",
    "technical_skills_score",
    "communication_score",
    "skills_score",
]

CATEGORICAL_FEATURES = [
    "branch",
]

TARGET = "placement"


# =========================================================
# 2. SKILL SCORE CALCULATION
# =========================================================

def calculate_skills_score(skills):
    """
    Parses semicolon-delimited skills (e.g. 'Python:Advanced;SQL:Intermediate')
    and returns a normalized percentage score (0.0 to 100.0).
    """
    if pd.isna(skills):
        return 0.0

    skills_str = str(skills).strip()
    if not skills_str:
        return 0.0

    total_score = 0
    skill_count = 0

    for item in skills_str.split(";"):
        item = item.strip()
        if ":" not in item:
            continue
        _, level = item.split(":", 1)
        level_key = level.strip().lower()
        if level_key in SKILL_LEVELS:
            total_score += SKILL_LEVELS[level_key]
            skill_count += 1

    if skill_count == 0:
        return 0.0

    avg = total_score / skill_count
    percentage = ((avg - 1.0) / 2.0) * 100.0
    return round(percentage, 2)


# =========================================================
# 3. TRAINING PIPELINE
# =========================================================

def train_and_save_model():
    print("\n" + "=" * 60)
    print("AI PLACEMENT PREDICTION - MODEL TRAINING")
    print("=" * 60)

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Run generate_dataset.py first.")

    # 1. Load Data
    data = pd.read_csv(DATASET_PATH)
    print(f"Loaded dataset: {len(data)} rows, {len(data.columns)} columns")

    # 2. Compute skills_score feature
    if "skills" in data.columns and "skills_score" not in data.columns:
        data["skills_score"] = data["skills"].apply(calculate_skills_score)
    elif "skills_score" not in data.columns:
        data["skills_score"] = 50.0

    # 3. Feature Selection & Validation
    required_cols = NUMERIC_FEATURES + CATEGORICAL_FEATURES + [TARGET]
    for col in required_cols:
        if col not in data.columns:
            raise ValueError(f"Required column '{col}' is missing from dataset.")

    X = data[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
    y = data[TARGET].copy()

    # Clean numeric features
    for col in NUMERIC_FEATURES:
        X[col] = pd.to_numeric(X[col], errors="coerce")

    # Clean categorical features
    for col in CATEGORICAL_FEATURES:
        X[col] = X[col].astype("string").str.strip().fillna("Unknown")

    y = pd.to_numeric(y, errors="coerce").fillna(0).astype(int)

    # 4. Train-Test Split (Stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")

    # 5. Preprocessing Pipelines
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])

    preprocessor = ColumnTransformer(transformers=[
        ("num", numeric_transformer, NUMERIC_FEATURES),
        ("cat", categorical_transformer, CATEGORICAL_FEATURES),
    ])

    # 6. Classifier Pipeline
    classifier = RandomForestClassifier(
        n_estimators=250,
        max_depth=12,
        min_samples_split=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", classifier),
    ])

    # 7. Model Fit & 5-Fold Cross Validation
    print("Training Random Forest model pipeline...")
    pipeline.fit(X_train, y_train)

    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="accuracy")
    cv_mean = round(float(np.mean(cv_scores)) * 100, 2)
    print(f"5-Fold Cross-Validation Accuracy: {cv_mean}%")

    # 8. Evaluation on Test Split
    y_pred = pipeline.predict(X_test)
    accuracy = round(accuracy_score(y_test, y_pred) * 100, 2)
    precision = round(precision_score(y_test, y_pred, zero_division=0) * 100, 2)
    recall = round(recall_score(y_test, y_pred, zero_division=0) * 100, 2)
    f1 = round(f1_score(y_test, y_pred, zero_division=0) * 100, 2)

    print("\n" + "-" * 40)
    print("TEST EVALUATION METRICS:")
    print("-" * 40)
    print(f"  • Test Accuracy : {accuracy}%")
    print(f"  • Precision     : {precision}%")
    print(f"  • Recall        : {recall}%")
    print(f"  • F1-Score      : {f1}%")
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=["Not Placed", "Placed"]))
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

    # 9. Save Artifacts
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\n[OK] Trained model saved to: {MODEL_PATH}")

    with open(ACCURACY_PATH, "w", encoding="utf-8") as f:
        f.write(str(accuracy))
    print(f"[OK] Accuracy record saved to: {ACCURACY_PATH}")

    print("=" * 60 + "\n")
    return pipeline, accuracy


if __name__ == "__main__":
    train_and_save_model()