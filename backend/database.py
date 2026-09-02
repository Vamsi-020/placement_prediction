"""
database.py
-----------
AI Placement Prediction System
SQLite database helper with thread safety, index optimizations,
and full CRUD operations for users and prediction history.
"""

import os
import json
import sqlite3
from contextlib import contextmanager
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "placement_system.db")


def get_db_connection():
    """Return an SQLite connection configured with dict-like row access."""
    conn = sqlite3.connect(DB_PATH, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def db_session():
    """Context manager for automated SQLite transaction commit & close."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def seed_demo_user():
    """Seed default demo user for 1-click test login."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM users WHERE LOWER(username) = 'demouser' OR LOWER(email) = 'demouser@example.com'"
        )
        if not cursor.fetchone():
            cursor.execute(
                """
                INSERT INTO users (username, email, password_hash, full_name, target_role, theme_preference)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    "demouser",
                    "demouser@example.com",
                    generate_password_hash("password123"),
                    "Demo Student",
                    "Software Engineer",
                    "dark"
                )
            )


def init_db():
    """Create database schema, tables, and indexing if they do not exist."""
    with db_session() as conn:
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

        # Indices for performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions(created_at)")

    seed_demo_user()
    print("Database initialized with tables and indexes.")


# =========================================================
# User Management Helpers
# =========================================================

def create_user(username, email, password_hash, full_name, target_role="Software Engineer", theme="dark"):
    """Insert a new registered user."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash, full_name, target_role, theme_preference)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                username.strip(),
                email.lower().strip(),
                password_hash,
                full_name.strip(),
                target_role.strip(),
                theme.strip()
            )
        )
        return cursor.lastrowid


def get_user_by_email_or_username(identifier):
    """Fetch user record by email or username."""
    ident = str(identifier).lower().strip()
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?",
            (ident, ident)
        )
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id):
    """Fetch user by primary key ID."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, username, email, full_name, target_role, theme_preference, created_at FROM users WHERE id = ?",
            (user_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None


def update_user_profile(user_id, full_name=None, email=None, target_role=None, theme_preference=None):
    """Update profile fields."""
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
        values.append(theme_preference.strip())

    if not fields:
        return True

    values.append(user_id)
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = ?", tuple(values))
        return cursor.rowcount > 0


def update_user_password(user_id, new_password_hash):
    """Update password hash."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_password_hash, user_id))
        return cursor.rowcount > 0


# =========================================================
# Prediction History Helpers
# =========================================================

def save_prediction(user_id, student_name, cgpa, internships, skills, communication, backlogs,
                    prediction, probability, confidence, suggestions, feature_importance):
    """Persist prediction attempt in database."""
    with db_session() as conn:
        cursor = conn.cursor()
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
        return cursor.lastrowid


def get_user_predictions(user_id, limit=50, offset=0):
    """Fetch user's prediction history sorted newest first."""
    with db_session() as conn:
        cursor = conn.cursor()
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
            item.pop("suggestions_json", None)
            item.pop("feature_importance_json", None)
            results.append(item)
        return results


def delete_prediction(prediction_id, user_id):
    """Delete a single prediction record."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM predictions WHERE id = ? AND user_id = ?", (prediction_id, user_id))
        return cursor.rowcount > 0


def clear_user_predictions(user_id):
    """Wipe all prediction records for a given user."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM predictions WHERE user_id = ?", (user_id,))
        return cursor.rowcount


def get_user_prediction_stats(user_id):
    """Calculate aggregate summary stats and historical deltas."""
    with db_session() as conn:
        cursor = conn.cursor()
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

        # Fetch first and latest records for delta calculation
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
        total = stats.get("total_predictions") or 0
        if first_record and latest_record and total > 1:
            delta = {
                "probability_change": round(latest_record["probability"] - first_record["probability"], 2),
                "cgpa_change": round(latest_record["cgpa"] - first_record["cgpa"], 2),
                "skills_change": round(latest_record["skills"] - first_record["skills"], 2),
                "communication_change": round(latest_record["communication"] - first_record["communication"], 2),
            }

        placed = stats.get("placed_count") or 0
        placement_rate = round((placed / max(1, total)) * 100, 1)

        return {
            "total_predictions": total,
            "placed_count": placed,
            "not_placed_count": stats.get("not_placed_count") or 0,
            "placement_rate": placement_rate,
            "avg_probability": round(stats.get("avg_probability") or 0.0, 1),
            "avg_cgpa": round(stats.get("avg_cgpa") or 0.0, 2),
            "avg_skills": round(stats.get("avg_skills") or 0.0, 1),
            "avg_communication": round(stats.get("avg_communication") or 0.0, 1),
            "avg_internships": round(stats.get("avg_internships") or 0.0, 1),
            "max_probability": round(stats.get("max_probability") or 0.0, 1),
            "min_probability": round(stats.get("min_probability") or 0.0, 1),
            "improvement_delta": delta,
            "has_history": total > 0,
        }
