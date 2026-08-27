"""
database.py
-----------
SQLite database helper for the AI Placement Prediction System.
Handles schema initialization and CRUD operations for:
1. users (authentication, profile, theme preferences)
2. predictions (history of predictions per user with ML inputs & outputs)
"""

import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "placement_system.db")


def get_db_connection():
    """Return a connection to the SQLite database with dict-like row access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            target_role TEXT DEFAULT 'Software Engineer',
            theme_preference TEXT DEFAULT 'dark',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Predictions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            student_name TEXT NOT NULL,
            cgpa REAL NOT NULL,
            internships INTEGER NOT NULL,
            skills REAL NOT NULL,
            communication REAL NOT NULL,
            backlogs INTEGER NOT NULL,
            prediction TEXT NOT NULL,
            probability REAL NOT NULL,
            confidence TEXT NOT NULL,
            suggestions_json TEXT NOT NULL,
            feature_importance_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()
    print("SQLite database initialized successfully.")


# =========================================================
# User CRUD Helpers
# =========================================================

def create_user(username, email, password_hash, full_name, target_role="Software Engineer", theme="dark"):
    """Insert a new user into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash, full_name, target_role, theme_preference)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (username.lower().strip(), email.lower().strip(), password_hash, full_name.strip(), target_role, theme)
        )
        conn.commit()
        user_id = cursor.lastrowid
        return user_id
    finally:
        conn.close()


def get_user_by_email_or_username(identifier):
    """Retrieve user record by email or username."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        ident = identifier.lower().strip()
        cursor.execute(
            "SELECT * FROM users WHERE email = ? OR username = ?",
            (ident, ident)
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_user_by_id(user_id):
    """Retrieve user record by user_id."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, username, email, full_name, target_role, theme_preference, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def update_user_profile(user_id, full_name=None, email=None, target_role=None, theme_preference=None):
    """Update editable profile fields for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        fields = []
        values = []
        if full_name is not None:
            fields.append("full_name = ?")
            values.append(full_name.strip())
        if email is not None:
            fields.append("email = ?")
            values.append(email.lower().strip())
        if target_role is not None:
            fields.append("target_role = ?")
            values.append(target_role.strip())
        if theme_preference is not None:
            fields.append("theme_preference = ?")
            values.append(theme_preference)

        if not fields:
            return True

        values.append(user_id)
        query = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(query, tuple(values))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def update_user_password(user_id, new_password_hash):
    """Update user password hash."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_password_hash, user_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


# =========================================================
# Prediction History CRUD Helpers
# =========================================================

def save_prediction(user_id, student_name, cgpa, internships, skills, communication, backlogs,
                    prediction, probability, confidence, suggestions, feature_importance):
    """Insert a prediction record into the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO predictions (
                user_id, student_name, cgpa, internships, skills, communication, backlogs,
                prediction, probability, confidence, suggestions_json, feature_importance_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                student_name,
                float(cgpa),
                int(internships),
                float(skills),
                float(communication),
                int(backlogs),
                prediction,
                float(probability),
                confidence,
                json.dumps(suggestions),
                json.dumps(feature_importance)
            )
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_user_predictions(user_id, limit=50, offset=0):
    """Fetch prediction history for a specific user, newest first."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT * FROM predictions
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT ? OFFSET ?
            """,
            (user_id, limit, offset)
        )
        rows = cursor.fetchall()
        results = []
        for r in rows:
            item = dict(r)
            try:
                item["suggestions"] = json.loads(item["suggestions_json"])
            except Exception:
                item["suggestions"] = []
            try:
                item["feature_importance"] = json.loads(item["feature_importance_json"])
            except Exception:
                item["feature_importance"] = {}
            del item["suggestions_json"]
            del item["feature_importance_json"]
            results.append(item)
        return results
    finally:
        conn.close()


def get_prediction_by_id(prediction_id, user_id=None):
    """Fetch single prediction by ID with optional user authorization."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id:
            cursor.execute("SELECT * FROM predictions WHERE id = ? AND user_id = ?", (prediction_id, user_id))
        else:
            cursor.execute("SELECT * FROM predictions WHERE id = ?", (prediction_id,))
        row = cursor.fetchone()
        if not row:
            return None
        item = dict(row)
        item["suggestions"] = json.loads(item["suggestions_json"])
        item["feature_importance"] = json.loads(item["feature_importance_json"])
        del item["suggestions_json"]
        del item["feature_importance_json"]
        return item
    finally:
        conn.close()


def delete_prediction(prediction_id, user_id):
    """Delete a prediction record for a specific user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM predictions WHERE id = ? AND user_id = ?", (prediction_id, user_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def clear_user_predictions(user_id):
    """Delete all prediction records for a specific user."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM predictions WHERE user_id = ?", (user_id,))
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()


def get_user_prediction_stats(user_id):
    """Compute aggregate analytics for a user's predictions."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT 
                COUNT(*) as total_predictions,
                SUM(CASE WHEN prediction = 'Placed' THEN 1 ELSE 0 END) as placed_count,
                SUM(CASE WHEN prediction = 'Not Placed' THEN 1 ELSE 0 END) as not_placed_count,
                AVG(probability) as avg_probability,
                AVG(cgpa) as avg_cgpa,
                AVG(skills) as avg_skills,
                AVG(communication) as avg_communication,
                AVG(internships) as avg_internships,
                MAX(probability) as max_probability,
                MIN(probability) as min_probability
            FROM predictions
            WHERE user_id = ?
            """,
            (user_id,)
        )
        row = cursor.fetchone()
        stats = dict(row) if row else {}

        # Fetch first and latest predictions to calculate improvement delta
        cursor.execute(
            "SELECT probability, cgpa, skills, communication, created_at FROM predictions WHERE user_id = ? ORDER BY id ASC LIMIT 1",
            (user_id,)
        )
        first_record = cursor.fetchone()

        cursor.execute(
            "SELECT probability, cgpa, skills, communication, created_at FROM predictions WHERE user_id = ? ORDER BY id DESC LIMIT 1",
            (user_id,)
        )
        latest_record = cursor.fetchone()

        delta = None
        if first_record and latest_record and (stats.get("total_predictions") or 0) > 1:
            delta = {
                "probability_change": round(latest_record["probability"] - first_record["probability"], 2),
                "cgpa_change": round(latest_record["cgpa"] - first_record["cgpa"], 2),
                "skills_change": round(latest_record["skills"] - first_record["skills"], 2),
                "communication_change": round(latest_record["communication"] - first_record["communication"], 2),
            }

        return {
            "total_predictions": stats.get("total_predictions") or 0,
            "placed_count": stats.get("placed_count") or 0,
            "not_placed_count": stats.get("not_placed_count") or 0,
            "placement_rate": round(((stats.get("placed_count") or 0) / max(1, stats.get("total_predictions") or 1)) * 100, 1),
            "avg_probability": round(stats.get("avg_probability") or 0, 1),
            "avg_cgpa": round(stats.get("avg_cgpa") or 0, 2),
            "avg_skills": round(stats.get("avg_skills") or 0, 1),
            "avg_communication": round(stats.get("avg_communication") or 0, 1),
            "avg_internships": round(stats.get("avg_internships") or 0, 1),
            "max_probability": round(stats.get("max_probability") or 0, 1),
            "min_probability": round(stats.get("min_probability") or 0, 1),
            "improvement_delta": delta,
            "has_history": (stats.get("total_predictions") or 0) > 0,
        }
    finally:
        conn.close()
