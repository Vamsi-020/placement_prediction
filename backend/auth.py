"""
auth.py
-------
AI Placement Prediction System
JWT Authentication, secure password hashing, and endpoint decorators.
"""

import os
import datetime
from functools import wraps
import jwt
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_user_by_id

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "placement-prediction-secret-key-2026-super-secure")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRATION_DAYS = 7


def hash_password(password: str) -> str:
    """Securely hash plain-text password using Werkzeug."""
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify plain password against hashed password."""
    return check_password_hash(password_hash, password)


def create_token(user_id: int, username: str, email: str) -> str:
    """Generate a signed JWT token valid for 7 days."""
    payload = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=TOKEN_EXPIRATION_DAYS),
        "iat": datetime.datetime.now(datetime.timezone.utc)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str):
    """Decode and validate signature and expiry of a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def get_token_from_header():
    """Extract token from the Authorization Bearer header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def token_required(f):
    """Route decorator requiring a valid JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        if not token:
            return jsonify({"error": "Authorization token is missing."}), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired authorization token."}), 401

        current_user = get_user_by_id(payload.get("user_id"))
        if not current_user:
            return jsonify({"error": "User account no longer exists."}), 401

        return f(current_user, *args, **kwargs)
    return decorated


def optional_token(f):
    """Route decorator attaching current_user if authenticated, else None."""
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = None
        token = get_token_from_header()
        if token:
            payload = decode_token(token)
            if payload:
                current_user = get_user_by_id(payload.get("user_id"))
        return f(current_user, *args, **kwargs)
    return decorated
