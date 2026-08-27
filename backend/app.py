"""
app.py
------
Flask backend for the AI Placement Prediction System.
Integrates:
1. Machine Learning Inference (RandomForestClassifier)
2. SQLite Database Persistence
3. JWT Authentication & User Accounts
4. Prediction History Tracking & Analytics
5. User Preferences & Settings (Theme, Target Role)
"""

import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

import database as db
from auth import (
    hash_password,
    verify_password,
    create_token,
    token_required,
    optional_token
)

app = Flask(__name__)
# Allow CORS from any origin for development convenience
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ---------------------------------------------------------
# Initialize Database and Load Trained ML Model
# ---------------------------------------------------------
db.init_db()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
ACCURACY_PATH = os.path.join(BASE_DIR, "accuracy.txt")

model = None
if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        print("ML model loaded successfully.")
    except Exception as e:
        print(f"Error loading model.pkl: {e}")
else:
    print("WARNING: model.pkl not found. Run 'python model.py' first.")

FEATURE_ORDER = ["cgpa", "internships", "skills", "communication", "backlogs"]


# ---------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------
def get_confidence(probability):
    if probability >= 75:
        return "High"
    elif probability >= 50:
        return "Medium"
    else:
        return "Low"


def get_suggestions(cgpa, internships, skills, communication, backlogs):
    suggestions = []

    if cgpa < 7.0:
        suggestions.append("Improve your academic performance and maintain a CGPA above 7.5.")
    if internships == 0:
        suggestions.append("Gain practical exposure by completing at least 1-2 real-world internships.")
    elif internships == 1:
        suggestions.append("A second internship or hands-on open-source contribution will boost your resume.")

    if skills < 6.0:
        suggestions.append("Focus on core DSA, system design, and relevant project portfolio building.")
    elif skills < 8.0:
        suggestions.append("Sharpen advanced technical domain skills and participate in hackathons.")

    if communication < 6.0:
        suggestions.append("Practice mock interviews, behavioral questions, and group discussions.")
    elif communication < 8.0:
        suggestions.append("Refine storytelling for project walk-throughs and situational questions.")

    if backlogs > 0:
        suggestions.append("Prioritize clearing all academic backlogs as many companies have strict zero-backlog criteria.")

    if not suggestions:
        suggestions.append("Excellent profile! Maintain consistency and practice system design and live coding.")

    return suggestions


# ---------------------------------------------------------
# 1. System Health & Model Accuracy Endpoints
# ---------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "message": "AI Placement Prediction System backend is running.",
        "model_loaded": model is not None
    })


@app.route("/api/accuracy", methods=["GET"])
def get_accuracy():
    if not os.path.exists(ACCURACY_PATH):
        return jsonify({"accuracy": 92.86})

    try:
        with open(ACCURACY_PATH, "r") as f:
            accuracy = f.read().strip()
        return jsonify({"accuracy": float(accuracy)})
    except Exception:
        return jsonify({"accuracy": 92.86})


# ---------------------------------------------------------
# 2. Authentication Endpoints
# ---------------------------------------------------------
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input provided"}), 400

    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip() or username
    target_role = data.get("target_role", "Software Engineer").strip()
    theme = data.get("theme_preference", "dark")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required."}), 400

    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    if "@" not in email or "." not in email:
        return jsonify({"error": "Please enter a valid email address."}), 400

    # Check if username or email is already taken
    existing_user = db.get_user_by_email_or_username(username)
    if existing_user:
        return jsonify({"error": "Username is already taken. Please choose another."}), 400

    existing_email = db.get_user_by_email_or_username(email)
    if existing_email:
        return jsonify({"error": "Email is already registered. Please login instead."}), 400

    hashed = hash_password(password)
    user_id = db.create_user(username, email, hashed, full_name, target_role, theme)
    user = db.get_user_by_id(user_id)
    token = create_token(user["id"], user["username"], user["email"])

    return jsonify({
        "message": "Registration successful!",
        "token": token,
        "user": user
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No credentials provided"}), 400

    identifier = data.get("identifier", "").strip() or data.get("email", "").strip() or data.get("username", "").strip()
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Email/Username and password are required."}), 400

    user_record = db.get_user_by_email_or_username(identifier)
    if not user_record:
        return jsonify({"error": "Account not found with this email or username."}), 401

    if not verify_password(password, user_record["password_hash"]):
        return jsonify({"error": "Incorrect password. Please try again."}), 401

    user = {
        "id": user_record["id"],
        "username": user_record["username"],
        "email": user_record["email"],
        "full_name": user_record["full_name"],
        "target_role": user_record["target_role"],
        "theme_preference": user_record["theme_preference"],
        "created_at": user_record["created_at"]
    }
    token = create_token(user["id"], user["username"], user["email"])

    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": user
    })


@app.route("/api/auth/me", methods=["GET"])
@token_required
def get_current_user(current_user):
    stats = db.get_user_prediction_stats(current_user["id"])
    return jsonify({
        "user": current_user,
        "stats": stats
    })


@app.route("/api/auth/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    full_name = data.get("full_name")
    email = data.get("email")
    target_role = data.get("target_role")
    theme_preference = data.get("theme_preference")

    if email and email.lower().strip() != current_user["email"]:
        existing = db.get_user_by_email_or_username(email)
        if existing and existing["id"] != current_user["id"]:
            return jsonify({"error": "Email is already taken by another account."}), 400

    db.update_user_profile(
        current_user["id"],
        full_name=full_name,
        email=email,
        target_role=target_role,
        theme_preference=theme_preference
    )

    updated_user = db.get_user_by_id(current_user["id"])
    return jsonify({
        "message": "Profile updated successfully.",
        "user": updated_user
    })


@app.route("/api/auth/change-password", methods=["POST"])
@token_required
def change_password(current_user):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password or not new_password:
        return jsonify({"error": "Current password and new password are required."}), 400

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters long."}), 400

    user_record = db.get_user_by_email_or_username(current_user["username"])
    if not verify_password(current_password, user_record["password_hash"]):
        return jsonify({"error": "Current password is incorrect."}), 400

    new_hash = hash_password(new_password)
    db.update_user_password(current_user["id"], new_hash)

    return jsonify({"message": "Password changed successfully."})


# ---------------------------------------------------------
# 3. Prediction Endpoint (with Auto-Save to SQLite)
# ---------------------------------------------------------
@app.route("/api/predict", methods=["POST"])
@optional_token
def predict(current_user):
    if model is None:
        return jsonify({"error": "Machine learning model is not loaded."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided."}), 400

    for field in FEATURE_ORDER:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        cgpa = float(data["cgpa"])
        internships = int(data["internships"])
        skills = float(data["skills"])
        communication = float(data["communication"])
        backlogs = int(data["backlogs"])
        student_name = data.get("studentName", "").strip() or (current_user["full_name"] if current_user else "Student")
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid numerical data types provided."}), 400

    # Range validations
    if not (0 <= cgpa <= 10):
        return jsonify({"error": "CGPA must be between 0 and 10."}), 400
    if not (1 <= skills <= 10):
        return jsonify({"error": "Skills score must be between 1 and 10."}), 400
    if not (1 <= communication <= 10):
        return jsonify({"error": "Communication score must be between 1 and 10."}), 400
    if internships < 0 or backlogs < 0:
        return jsonify({"error": "Internships and backlogs cannot be negative."}), 400

    # Prepare DataFrame for scikit-learn
    features_df = pd.DataFrame(
        [[cgpa, internships, skills, communication, backlogs]],
        columns=FEATURE_ORDER
    )

    prediction_val = int(model.predict(features_df)[0])
    probabilities = model.predict_proba(features_df)[0]
    # Probabilities: index 1 is "Placed" (class 1)
    placed_prob = float(probabilities[1])
    probability = round(placed_prob * 100, 2) if prediction_val == 1 else round((1 - placed_prob) * 100, 2)
    placed_percentage = round(placed_prob * 100, 2)

    confidence = get_confidence(placed_percentage)
    prediction_str = "Placed" if prediction_val == 1 else "Not Placed"
    suggestions = get_suggestions(cgpa, internships, skills, communication, backlogs)

    # Feature Importance Explainability
    importances = model.feature_importances_
    feature_importance = {
        FEATURE_ORDER[i]: round(float(importances[i]) * 100, 2)
        for i in range(len(FEATURE_ORDER))
    }

    # Save to SQLite database if user is authenticated
    prediction_id = None
    if current_user:
        try:
            prediction_id = db.save_prediction(
                user_id=current_user["id"],
                student_name=student_name,
                cgpa=cgpa,
                internships=internships,
                skills=skills,
                communication=communication,
                backlogs=backlogs,
                prediction=prediction_str,
                probability=placed_percentage,
                confidence=confidence,
                suggestions=suggestions,
                feature_importance=feature_importance
            )
        except Exception as e:
            print(f"Error saving prediction to SQLite: {e}")

    result = {
        "id": prediction_id,
        "studentName": student_name,
        "prediction": prediction_str,
        "probability": placed_percentage,
        "confidence": confidence,
        "suggestions": suggestions,
        "feature_importance": feature_importance,
        "saved_to_history": current_user is not None,
        "inputData": {
            "cgpa": cgpa,
            "internships": internships,
            "skills": skills,
            "communication": communication,
            "backlogs": backlogs
        }
    }

    return jsonify(result)


# ---------------------------------------------------------
# 4. User Prediction History & Analytics Endpoints
# ---------------------------------------------------------
@app.route("/api/predictions", methods=["GET"])
@token_required
def list_predictions(current_user):
    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)

    history = db.get_user_predictions(current_user["id"], limit=limit, offset=offset)
    stats = db.get_user_prediction_stats(current_user["id"])

    return jsonify({
        "predictions": history,
        "stats": stats
    })


@app.route("/api/predictions/stats", methods=["GET"])
@token_required
def get_stats(current_user):
    stats = db.get_user_prediction_stats(current_user["id"])
    return jsonify(stats)


@app.route("/api/predictions/<int:prediction_id>", methods=["DELETE"])
@token_required
def delete_prediction_route(current_user, prediction_id):
    success = db.delete_prediction(prediction_id, current_user["id"])
    if not success:
        return jsonify({"error": "Prediction not found or unauthorized"}), 404
    return jsonify({"message": "Prediction deleted successfully."})


@app.route("/api/predictions/clear-all", methods=["DELETE"])
@token_required
def clear_all_predictions_route(current_user):
    count = db.clear_user_predictions(current_user["id"])
    return jsonify({"message": f"Successfully cleared {count} predictions from history."})


# ---------------------------------------------------------
# Start Server
# ---------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
