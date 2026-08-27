"""
model.py
--------
This script trains a Random Forest Classifier on the placement dataset
and saves the trained model + accuracy score to disk.

Steps:
1. Read dataset.csv
2. Select input features (X) and target (y)
3. Split into training and testing sets
4. Train a RandomForestClassifier
5. Evaluate accuracy on the test set
6. Save the trained model as model.pkl (using Joblib)
7. Save the accuracy value as accuracy.txt
"""

import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
ACCURACY_PATH = os.path.join(BASE_DIR, "accuracy.txt")

# ---------------------------------------------------------
# 1. Load the dataset
# ---------------------------------------------------------
data = pd.read_csv(DATASET_PATH)

# ---------------------------------------------------------
# 2. Select features (input columns) and target (output column)
# ---------------------------------------------------------
features = [
    "cgpa",
    "internships",
    "skills",
    "communication",
    "backlogs"
]
target = "placed"

X = data[features]
y = data[target]

# ---------------------------------------------------------
# 3. Split the dataset into training and testing data
# ---------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ---------------------------------------------------------
# 4. Train a Random Forest Classifier
# ---------------------------------------------------------
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# ---------------------------------------------------------
# 5. Predict on test data and calculate accuracy
# ---------------------------------------------------------
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
accuracy_percent = round(accuracy * 100, 2)

print(f"Model trained successfully!")
print(f"Model Accuracy: {accuracy_percent}%")

# ---------------------------------------------------------
# 6. Save the trained model using Joblib
# ---------------------------------------------------------
joblib.dump(model, MODEL_PATH)

# ---------------------------------------------------------
# 7. Save the accuracy value to accuracy.txt
# ---------------------------------------------------------
with open(ACCURACY_PATH, "w") as f:
    f.write(str(accuracy_percent))

print("Saved model.pkl and accuracy.txt successfully.")
