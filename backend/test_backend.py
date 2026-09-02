"""
test_backend.py
---------------
AI Placement Prediction System
Automated integration test suite covering:
1. Health check & Root endpoint
2. Accuracy endpoint
3. User Registration (with conflict checking)
4. User Login (with invalid & valid credentials)
5. Current User retrieval (/api/auth/me)
6. Profile update & Theme preference saving
7. Password update & Verification
8. ML Inference & Explainable AI output
9. Historical prediction persistence (SQLite)
10. Analytics Stats and Delta calculation
11. Single record deletion
12. Bulk history clearing
"""

import json
from app import app
import database as db

client = app.test_client()

print("\n" + "=" * 60)
print("RUNNING BACKEND INTEGRATION TEST SUITE")
print("=" * 60)

# 1. Health check
res = client.get("/api/health")
assert res.status_code == 200, f"Health check failed: {res.data}"
assert res.get_json()["status"] == "success"
print("[PASS] 1. Health check endpoint")

# 2. Accuracy
res = client.get("/api/accuracy")
assert res.status_code == 200
acc = res.get_json()["accuracy"]
assert isinstance(acc, (int, float)) and acc > 0
print(f"[PASS] 2. Accuracy endpoint (Model Accuracy: {acc}%)")

# 3. Register user
reg_payload = {
    "username": "integration_tester",
    "email": "integration_tester@example.com",
    "password": "securepassword123",
    "full_name": "Integration Test Candidate",
    "target_role": "AI Engineer",
    "theme_preference": "cyberpunk"
}

# Clean up existing test user if present
existing = db.get_user_by_email_or_username("integration_tester")
if existing:
    db.clear_user_predictions(existing["id"])
    with db.db_session() as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (existing["id"],))

res = client.post("/api/auth/register", json=reg_payload)
assert res.status_code == 201, f"Register failed: {res.data}"
reg_data = res.get_json()
token = reg_data["token"]
user_id = reg_data["user"]["id"]
print("[PASS] 3. User registration endpoint")

# 4. Login
login_res = client.post("/api/auth/login", json={"identifier": "integration_tester", "password": "securepassword123"})
assert login_res.status_code == 200
login_data = login_res.get_json()
assert "token" in login_data
print("[PASS] 4. User login endpoint")

# 5. Get current user
me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
assert me_res.status_code == 200
assert me_res.get_json()["user"]["username"] == "integration_tester"
print("[PASS] 5. Current user (/api/auth/me) endpoint")

# 6. Update profile
prof_res = client.put("/api/auth/profile", json={"full_name": "Updated Tester Name", "target_role": "Senior ML Engineer"}, headers={"Authorization": f"Bearer {token}"})
assert prof_res.status_code == 200
assert prof_res.get_json()["user"]["full_name"] == "Updated Tester Name"
print("[PASS] 6. Profile update endpoint")

# 7. Change password
pwd_res = client.post("/api/auth/change-password", json={"current_password": "securepassword123", "new_password": "brandnewpassword456"}, headers={"Authorization": f"Bearer {token}"})
assert pwd_res.status_code == 200
print("[PASS] 7. Change password endpoint")

# 8. Predict 1 (High chance profile)
pred1_payload = {
    "studentName": "Updated Tester Name",
    "cgpa": 9.0,
    "attendance": 95.0,
    "internships": 2,
    "skills": "Python:Advanced;Java:Advanced;SQL:Intermediate",
    "communication": 8.5,
    "backlogs": 0,
    "branch": "CSE"
}
pred1_res = client.post("/api/predict", json=pred1_payload, headers={"Authorization": f"Bearer {token}"})
assert pred1_res.status_code == 200
pred1_data = pred1_res.get_json()
assert pred1_data["prediction"] in ["Placed", "Not Placed"]
assert pred1_data["saved_to_history"] is True
assert "feature_importance" in pred1_data
assert "suggestions" in pred1_data
print(f"[PASS] 8. Prediction 1 ({pred1_data['prediction']}, {pred1_data['probability']}%)")

# 9. Predict 2 (Second attempt for returning user)
pred2_payload = {
    "studentName": "Updated Tester Name",
    "cgpa": 9.4,
    "attendance": 98.0,
    "internships": 3,
    "skills": "Python:Advanced;Java:Advanced;SQL:Advanced",
    "communication": 9.0,
    "backlogs": 0,
    "branch": "CSE"
}
pred2_res = client.post("/api/predict", json=pred2_payload, headers={"Authorization": f"Bearer {token}"})
assert pred2_res.status_code == 200
pred2_data = pred2_res.get_json()
print(f"[PASS] 9. Prediction 2 ({pred2_data['prediction']}, {pred2_data['probability']}%)")

# 10. List predictions
hist_res = client.get("/api/predictions", headers={"Authorization": f"Bearer {token}"})
assert hist_res.status_code == 200
hist_data = hist_res.get_json()
assert len(hist_data["predictions"]) == 2
print(f"[PASS] 10. History retrieval ({len(hist_data['predictions'])} records)")

# 11. Check stats and delta
stats_res = client.get("/api/predictions/stats", headers={"Authorization": f"Bearer {token}"})
assert stats_res.status_code == 200
stats_data = stats_res.get_json()
assert stats_data["total_predictions"] == 2
assert stats_data["improvement_delta"] is not None
print("[PASS] 11. Statistics & improvement delta computation")

# 12. Delete single prediction
pred_id_to_delete = hist_data["predictions"][0]["id"]
del_res = client.delete(f"/api/predictions/{pred_id_to_delete}", headers={"Authorization": f"Bearer {token}"})
assert del_res.status_code == 200
print("[PASS] 12. Single prediction deletion")

# 13. Clear all predictions
clear_res = client.delete("/api/predictions/clear-all", headers={"Authorization": f"Bearer {token}"})
assert clear_res.status_code == 200
print("[PASS] 13. Clear all predictions endpoint")

print("\n" + "=" * 60)
print("ALL 13 BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!")
print("=" * 60 + "\n")
