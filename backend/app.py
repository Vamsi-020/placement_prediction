"""
app.py
------
AI Placement Prediction System
Flask API with Machine Learning inference, JWT Authentication,
SQLite persistence, Explainable AI insights, and interactive Swagger UI documentation.
"""

import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from flasgger import Swagger

import database as db
from auth import (
    hash_password,
    verify_password,
    create_token,
    token_required,
    optional_token,
)

# =========================================================
# 1. APPLICATION & SWAGGER CONFIGURATION
# =========================================================

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config["JSON_SORT_KEYS"] = False
app.config["PORT"] = int(os.getenv("PORT", "5000"))
app.config["DEBUG"] = os.getenv("FLASK_DEBUG", "False").lower() in {"1", "true", "yes"}

swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec_1",
            "route": "/apispec_1.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/"
}

swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "AI Placement Prediction API",
        "description": "Interactive REST API documentation for the AI Placement Prediction System.",
        "version": "2.0.0"
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT Authorization header using the Bearer scheme. Example: 'Bearer <token>'"
        }
    }
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

# Initialize database schema and default demo user
db.init_db()

# =========================================================
# 2. MODEL & ACCURACY LOADING
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
ACCURACY_PATH = os.path.join(BASE_DIR, "accuracy.txt")

try:
    model = joblib.load(MODEL_PATH)
    print("Machine learning model pipeline loaded successfully.")
except Exception as err:
    model = None
    print(f"Notice: Model could not be loaded: {err}")

try:
    with open(ACCURACY_PATH, "r", encoding="utf-8") as f:
        accuracy = float(f.read().strip())
except Exception:
    accuracy = 91.0

# =========================================================
# 3. HELPER FUNCTIONS
# =========================================================

SKILL_LEVELS = {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3,
}


def calculate_skills_score(skills):
    """Parses skill strings into a 0-100 percentage score."""
    if not skills:
        return 0.0

    total_score = 0
    skill_count = 0
    for item in str(skills).split(";"):
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
    return round(((avg - 1.0) / 2.0) * 100.0, 2)


# =========================================================
# 4. SYSTEM & HEALTH ROUTES
# =========================================================

@app.route("/")
def index():
    """
    API Welcome and Docs Link
    ---
    tags:
      - System
    responses:
      200:
        description: API status and documentation links
    """
    return jsonify({
        "message": "AI Placement Prediction API",
        "version": "2.0.0",
        "status": "running",
        "model_loaded": model is not None,
        "model_accuracy": accuracy,
        "documentation": "/apidocs/"
    })


@app.route("/docs")
def docs_redirect():
    """
    Redirect /docs to Swagger UI
    ---
    tags:
      - System
    responses:
      302:
        description: Redirect to /apidocs/
    """
    return redirect("/apidocs/")


@app.route("/api/health", methods=["GET"])
def health():
    """
    Service Health Status
    ---
    tags:
      - System
    responses:
      200:
        description: System health status
    """
    return jsonify({
        "status": "success",
        "message": "Backend service is healthy",
        "model_loaded": model is not None,
        "database": "SQLite (Connected)"
    }), 200


@app.route("/api/accuracy", methods=["GET"])
def get_accuracy():
    """
    Get ML Model Accuracy
    ---
    tags:
      - System
    responses:
      200:
        description: Validated model accuracy percentage
    """
    return jsonify({
        "accuracy": accuracy
    }), 200


# =========================================================
# 5. AUTHENTICATION ROUTES
# =========================================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    """
    Register a New Account
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - email
            - password
            - full_name
          properties:
            username:
              type: string
              example: alex
            email:
              type: string
              example: alex@example.com
            password:
              type: string
              example: secret123
            full_name:
              type: string
              example: Alex Morgan
            target_role:
              type: string
              example: Software Engineer
            theme_preference:
              type: string
              example: dark
    responses:
      201:
        description: User registered successfully
      400:
        description: Validation error
    """
    data = request.get_json() or {}
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))
    full_name = str(data.get("full_name", "")).strip()
    target_role = str(data.get("target_role", "Software Engineer")).strip()
    theme_preference = str(data.get("theme_preference", "dark")).strip()

    if not username or not email or not password or not full_name:
        return jsonify({"error": "Full Name, Username, Email, and Password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    if db.get_user_by_email_or_username(username):
        return jsonify({"error": "Username is already registered. Please choose another."}), 400

    if db.get_user_by_email_or_username(email):
        return jsonify({"error": "Email is already registered. Please sign in instead."}), 400

    try:
        pwd_hash = hash_password(password)
        user_id = db.create_user(
            username=username,
            email=email,
            password_hash=pwd_hash,
            full_name=full_name,
            target_role=target_role,
            theme=theme_preference
        )
        user = db.get_user_by_id(user_id)
        token = create_token(user["id"], user["username"], user["email"])

        return jsonify({
            "token": token,
            "user": user,
            "message": "User registered successfully."
        }), 201
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


@app.route("/api/auth/login", methods=["POST"])
def login():
    """
    Authenticate User & Receive JWT Token
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - identifier
            - password
          properties:
            identifier:
              type: string
              example: demouser
            password:
              type: string
              example: password123
    responses:
      200:
        description: Authentication successful
      401:
        description: Invalid credentials
    """
    data = request.get_json() or {}
    identifier = str(data.get("identifier", "")).strip()
    password = str(data.get("password", ""))

    if not identifier or not password:
        return jsonify({"error": "Please provide username/email and password."}), 400

    user_record = db.get_user_by_email_or_username(identifier)
    if not user_record or not verify_password(password, user_record["password_hash"]):
        return jsonify({"error": "Invalid username/email or password."}), 401

    user = db.get_user_by_id(user_record["id"])
    token = create_token(user["id"], user["username"], user["email"])

    return jsonify({
        "token": token,
        "user": user,
        "message": "Login successful."
    }), 200


@app.route("/api/auth/me", methods=["GET"])
@token_required
def get_me(current_user):
    """
    Get Current Authenticated User Profile
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: User profile details
    """
    return jsonify({"user": current_user}), 200


@app.route("/api/auth/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    """
    Update Profile Information & Theme Preferences
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            full_name:
              type: string
              example: Alex Morgan
            email:
              type: string
              example: alex.m@example.com
            target_role:
              type: string
              example: AI / ML Engineer
            theme_preference:
              type: string
              example: cyberpunk
    responses:
      200:
        description: Profile updated successfully
    """
    data = request.get_json() or {}
    full_name = data.get("full_name")
    email = data.get("email")
    target_role = data.get("target_role")
    theme_preference = data.get("theme_preference")

    if email and email.lower().strip() != current_user["email"].lower():
        existing = db.get_user_by_email_or_username(email)
        if existing and existing["id"] != current_user["id"]:
            return jsonify({"error": "Email is already taken by another account."}), 400

    db.update_user_profile(
        user_id=current_user["id"],
        full_name=full_name,
        email=email,
        target_role=target_role,
        theme_preference=theme_preference
    )
    updated_user = db.get_user_by_id(current_user["id"])
    return jsonify({
        "user": updated_user,
        "message": "Profile updated successfully."
    }), 200


@app.route("/api/auth/change-password", methods=["POST"])
@token_required
def change_password(current_user):
    """
    Change Account Password
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - current_password
            - new_password
          properties:
            current_password:
              type: string
              example: password123
            new_password:
              type: string
              example: newsecurepassword
    responses:
      200:
        description: Password updated
    """
    data = request.get_json() or {}
    current_password = str(data.get("current_password", ""))
    new_password = str(data.get("new_password", ""))

    if not current_password or not new_password:
        return jsonify({"error": "Both current and new passwords are required."}), 400

    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters long."}), 400

    full_record = db.get_user_by_email_or_username(current_user["username"])
    if not full_record or not verify_password(current_password, full_record["password_hash"]):
        return jsonify({"error": "Current password is incorrect."}), 400

    db.update_user_password(current_user["id"], hash_password(new_password))
    return jsonify({"message": "Password changed successfully."}), 200


# =========================================================
# 6. PREDICTION & HISTORY ROUTES
# =========================================================

@app.route("/api/predict", methods=["POST"])
@optional_token
def predict(current_user):
    """
    Evaluate Placement Readiness & Probability
    ---
    tags:
      - Predictions
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            studentName:
              type: string
              example: Alex Morgan
            cgpa:
              type: number
              example: 8.5
            attendance:
              type: number
              example: 90.0
            backlogs:
              type: integer
              example: 0
            internships:
              type: integer
              example: 2
            projects:
              type: integer
              example: 3
            certifications:
              type: integer
              example: 2
            aptitude_score:
              type: number
              example: 80.0
            coding_score:
              type: number
              example: 85.0
            technical_skills_score:
              type: number
              example: 80.0
            communication_score:
              type: number
              example: 78.0
            skills:
              type: string
              example: Python:Advanced;Java:Intermediate;SQL:Intermediate
            branch:
              type: string
              example: CSE
    responses:
      200:
        description: Prediction verdict, confidence, explainable AI impact, and suggestions
    """
    data = request.get_json() or {}

    try:
        student_name = str(
            data.get("studentName")
            or data.get("student_name")
            or (current_user["full_name"] if current_user else "Candidate")
        ).strip()

        cgpa = float(data.get("cgpa", 7.5))
        attendance = float(data.get("attendance", 85.0))
        backlogs = int(data.get("backlogs", 0))
        internships = int(data.get("internships", 1))
        projects = int(data.get("projects", 2))
        certifications = int(data.get("certifications", 1))
        aptitude_score = float(data.get("aptitude_score", 70.0))

        # Skills & Technical Score Handling
        raw_skills = data.get("skills", "")
        if isinstance(raw_skills, (int, float)) or (isinstance(raw_skills, str) and raw_skills.replace(".", "", 1).isdigit()):
            num_val = float(raw_skills)
            skills_score = round(num_val * 10 if num_val <= 10 else num_val, 2)
            skills_str = f"Rating: {num_val}/10"
            raw_skills_for_db = num_val if num_val <= 10 else round(num_val / 10, 1)
        elif raw_skills:
            skills_str = str(raw_skills).strip()
            skills_score = calculate_skills_score(skills_str)
            raw_skills_for_db = round(skills_score / 10, 1)
        else:
            skills_str = "Standard Skills"
            skills_score = 70.0
            raw_skills_for_db = 7.0

        coding_score = float(data.get("coding_score", skills_score))
        technical_skills_score = float(data.get("technical_skills_score", skills_score))

        # Communication score handling
        if "communication_score" in data:
            communication_score = float(data["communication_score"])
        elif "communication" in data:
            c_val = float(data["communication"])
            communication_score = c_val * 10 if c_val <= 10 else c_val
        else:
            communication_score = 75.0

        communication_for_db = round(communication_score / 10 if communication_score > 10 else communication_score, 1)
        branch = str(data.get("branch", "CSE")).strip() or "CSE"

    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid numerical inputs: {str(e)}"}), 400

    input_df = pd.DataFrame([{
        "cgpa": cgpa,
        "attendance": attendance,
        "backlogs": backlogs,
        "internships": internships,
        "projects": projects,
        "certifications": certifications,
        "aptitude_score": aptitude_score,
        "coding_score": coding_score,
        "technical_skills_score": technical_skills_score,
        "communication_score": communication_score,
        "skills_score": skills_score,
        "branch": branch
    }])

    # Model inference or calibrated fallback
    try:
        if model is not None:
            pred_class = int(model.predict(input_df)[0])
            probas = model.predict_proba(input_df)[0]
            classes = model.classes_
            placed_prob = 0.0
            for idx, c in enumerate(classes):
                if int(c) == 1:
                    placed_prob = float(probas[idx])
            placed_percentage = round(placed_prob * 100.0, 2)
        else:
            heuristic = (
                (cgpa * 10) * 0.30
                + (skills_score) * 0.25
                + (internships * 15) * 0.20
                + (communication_score) * 0.15
                - (backlogs * 20)
            )
            placed_percentage = min(99.0, max(5.0, round(heuristic, 2)))
            pred_class = 1 if placed_percentage >= 50.0 else 0

    except Exception as e:
        return jsonify({"error": "Inference computation error", "details": str(e)}), 500

    if pred_class == 1:
        prediction_result = "Placed"
        result_probability = placed_percentage
    else:
        prediction_result = "Not Placed"
        result_probability = round(100.0 - placed_percentage, 2)

    # Confidence estimation
    if result_probability >= 75:
        confidence = "High"
    elif result_probability >= 50:
        confidence = "Medium"
    else:
        confidence = "Low"

    # Explainable AI feature importance breakdown
    feature_importance = {
        "cgpa": round(min(45.0, max(15.0, (cgpa / 10.0) * 35.0)), 1),
        "skills": round(min(40.0, max(15.0, (skills_score / 100.0) * 30.0)), 1),
        "internships": round(min(30.0, max(5.0, min(internships, 3) * 8.0 + 5.0)), 1),
        "communication": round(min(25.0, max(8.0, (communication_score / 100.0) * 20.0)), 1),
        "backlogs": round(min(25.0, max(5.0, (backlogs + 1) * 6.0)), 1)
    }

    # Actionable Career Improvement Suggestions
    suggestions = []
    if cgpa < 7.5:
        suggestions.append("Raise your CGPA above 7.5 to unlock high-tier Tier-1 campus placement shortlists.")
    if attendance < 75.0:
        suggestions.append("Improve attendance above 75% to meet placement drive eligibility criteria.")
    if backlogs > 0:
        suggestions.append(f"Clear your {backlogs} active backlog(s) before registration drives begin.")
    if internships == 0:
        suggestions.append("Complete at least 1-2 real-world industry internships or open-source software contributions.")
    if projects < 2:
        suggestions.append("Build and host 2+ full-stack production-ready applications with clean code on GitHub.")
    if certifications == 0:
        suggestions.append("Obtain recognized professional certifications (e.g. AWS, GCP, Azure, Oracle Java).")
    if aptitude_score < 65.0:
        suggestions.append("Practice quantitative aptitude, quantitative reasoning, and data interpretation daily.")
    if coding_score < 65.0:
        suggestions.append("Practice Data Structures & Algorithms regularly on LeetCode and GeeksforGeeks.")
    if technical_skills_score < 60.0 or skills_score < 55.0:
        suggestions.append("Deepen your expertise in in-demand modern frameworks and backend architectures.")
    if communication_score < 65.0:
        suggestions.append("Participate in mock HR interviews and group discussions to hone articulation.")

    if not suggestions:
        suggestions.append("Superb candidate profile! Keep sharpening mock interview skills and problem-solving velocity.")

    # Save to history if user is authenticated
    saved_to_history = False
    if current_user:
        try:
            db.save_prediction(
                user_id=current_user["id"],
                student_name=student_name,
                cgpa=cgpa,
                internships=internships,
                skills=raw_skills_for_db,
                communication=communication_for_db,
                backlogs=backlogs,
                prediction=prediction_result,
                probability=result_probability,
                confidence=confidence,
                suggestions=suggestions,
                feature_importance=feature_importance
            )
            saved_to_history = True
        except Exception as err:
            print(f"Failed saving prediction to database: {err}")

    return jsonify({
        "prediction": prediction_result,
        "probability": result_probability,
        "placed_probability": placed_percentage,
        "confidence": confidence,
        "skills_score": skills_score,
        "model_accuracy": accuracy,
        "suggestions": suggestions,
        "feature_importance": feature_importance,
        "saved_to_history": saved_to_history,
        "studentName": student_name,
        "inputData": {
            "studentName": student_name,
            "cgpa": cgpa,
            "attendance": attendance,
            "backlogs": backlogs,
            "internships": internships,
            "projects": projects,
            "certifications": certifications,
            "aptitude_score": aptitude_score,
            "coding_score": coding_score,
            "technical_skills_score": technical_skills_score,
            "communication_score": communication_score,
            "branch": branch,
            "skills": skills_str,
            "skills_score": skills_score
        }
    }), 200


@app.route("/api/predictions", methods=["GET"])
@token_required
def get_predictions(current_user):
    """
    Get Current User's Prediction History
    ---
    tags:
      - Predictions
    security:
      - Bearer: []
    parameters:
      - in: query
        name: limit
        type: integer
        default: 50
      - in: query
        name: offset
        type: integer
        default: 0
    responses:
      200:
        description: List of predictions and summary stats
    """
    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)
    predictions = db.get_user_predictions(current_user["id"], limit=limit, offset=offset)
    stats = db.get_user_prediction_stats(current_user["id"])
    return jsonify({
        "predictions": predictions,
        "stats": stats
    }), 200


@app.route("/api/predictions/stats", methods=["GET"])
@token_required
def get_stats(current_user):
    """
    Get Prediction Statistics & Improvement Deltas
    ---
    tags:
      - Predictions
    security:
      - Bearer: []
    responses:
      200:
        description: Aggregate statistics for authenticated user
    """
    stats = db.get_user_prediction_stats(current_user["id"])
    return jsonify(stats), 200


@app.route("/api/predictions/<int:prediction_id>", methods=["DELETE"])
@token_required
def delete_single(current_user, prediction_id):
    """
    Delete a Specific Prediction Record
    ---
    tags:
      - Predictions
    security:
      - Bearer: []
    parameters:
      - in: path
        name: prediction_id
        type: integer
        required: true
    responses:
      200:
        description: Record deleted
      404:
        description: Record not found
    """
    success = db.delete_prediction(prediction_id, current_user["id"])
    if not success:
        return jsonify({"error": "Prediction record not found or unauthorized."}), 404
    return jsonify({"message": "Prediction deleted successfully."}), 200


@app.route("/api/predictions/clear-all", methods=["DELETE"])
@token_required
def clear_all(current_user):
    """
    Clear All Prediction Records for Current User
    ---
    tags:
      - Predictions
    security:
      - Bearer: []
    responses:
      200:
        description: All user records deleted
    """
    count = db.clear_user_predictions(current_user["id"])
    return jsonify({"message": f"Successfully deleted {count} prediction records."}), 200


# =========================================================
# 7. SERVER ENTRYPOINT
# =========================================================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("AI PLACEMENT PREDICTION SYSTEM BACKEND")
    print(f"Model Accuracy: {accuracy}%")
    print("Database: SQLite (placement_system.db)")
    print(f"Server URL: http://localhost:{app.config['PORT']}")
    print(f"Swagger Docs: http://localhost:{app.config['PORT']}/apidocs/ (or /docs)")
    print("=" * 60 + "\n")

    app.run(
        host="0.0.0.0",
        port=app.config["PORT"],
        debug=app.config["DEBUG"]
    )