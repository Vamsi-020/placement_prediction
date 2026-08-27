"""Full integration test for all backend endpoints."""
import json
from app import app
import database as db

client = app.test_client()

# 1. Health check
res = client.get("/api/health")
assert res.status_code == 200, f"Health check failed: {res.data}"
print("[PASS] Health check passed:", res.get_json())

# 2. Accuracy
res = client.get("/api/accuracy")
assert res.status_code == 200
print("[PASS] Accuracy endpoint passed:", res.get_json())

# 3. Register user
reg_payload = {
    "username": "tester_pro",
    "email": "tester_pro@example.com",
    "password": "securepassword123",
    "full_name": "Test Candidate Pro",
    "target_role": "AI Engineer",
    "theme_preference": "cyberpunk"
}
# Delete if already exists from previous runs
existing = db.get_user_by_email_or_username("tester_pro")
if existing:
    db.clear_user_predictions(existing["id"])
    conn = db.get_db_connection()
    conn.execute("DELETE FROM users WHERE id = ?", (existing["id"],))
    conn.commit()
    conn.close()

res = client.post("/api/auth/register", json=reg_payload)
assert res.status_code == 201, f"Register failed: {res.data}"
reg_data = res.get_json()
token = reg_data["token"]
user_id = reg_data["user"]["id"]
print("[PASS] Register passed, received token:", token[:15] + "...")

# 4. Login
login_res = client.post("/api/auth/login", json={"identifier": "tester_pro", "password": "securepassword123"})
assert login_res.status_code == 200
print("[PASS] Login passed")

# 5. Get current user
me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
assert me_res.status_code == 200
print("[PASS] /api/auth/me passed:", me_res.get_json()["user"]["username"])

# 6. Update profile
prof_res = client.put("/api/auth/profile", json={"full_name": "Updated Test Name", "target_role": "Data Scientist"}, headers={"Authorization": f"Bearer {token}"})
assert prof_res.status_code == 200
print("[PASS] Profile update passed")

# 7. Predict 1 (High chance candidate)
pred1_payload = {
    "studentName": "Updated Test Name",
    "cgpa": 8.8,
    "internships": 2,
    "skills": 9.0,
    "communication": 8.5,
    "backlogs": 0
}
pred1_res = client.post("/api/predict", json=pred1_payload, headers={"Authorization": f"Bearer {token}"})
assert pred1_res.status_code == 200
pred1_data = pred1_res.get_json()
assert pred1_data["prediction"] == "Placed"
assert pred1_data["saved_to_history"] is True
print("[PASS] Prediction 1 passed:", pred1_data["prediction"], f"({pred1_data['probability']}%)")

# 8. Predict 2 (Second attempt for returning user)
pred2_payload = {
    "studentName": "Updated Test Name",
    "cgpa": 9.2,
    "internships": 3,
    "skills": 9.5,
    "communication": 9.0,
    "backlogs": 0
}
pred2_res = client.post("/api/predict", json=pred2_payload, headers={"Authorization": f"Bearer {token}"})
assert pred2_res.status_code == 200
pred2_data = pred2_res.get_json()
print("[PASS] Prediction 2 passed:", pred2_data["prediction"], f"({pred2_data['probability']}%)")

# 9. List Predictions History
hist_res = client.get("/api/predictions", headers={"Authorization": f"Bearer {token}"})
assert hist_res.status_code == 200
hist_data = hist_res.get_json()
assert len(hist_data["predictions"]) == 2
print(f"[PASS] History retrieval passed, found {len(hist_data['predictions'])} prediction(s)")

# 10. Check Stats & Deltas
stats_res = client.get("/api/predictions/stats", headers={"Authorization": f"Bearer {token}"})
assert stats_res.status_code == 200
stats_data = stats_res.get_json()
assert stats_data["total_predictions"] == 2
print("[PASS] Stats & delta calculations passed:", stats_data["improvement_delta"])

print("\nALL 10 INTEGRATION TESTS PASSED SUCCESSFULLY!")
