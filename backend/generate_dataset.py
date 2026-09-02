"""
generate_dataset.py
-------------------
AI Placement Prediction System
Generates a realistic synthetic student placement dataset with diverse
academic metrics, project portfolios, technical skill ratings, and career outcomes.

Output:
    backend/dataset.csv
    data/dataset.csv
"""

import os
import random
import pandas as pd

# =========================================================
# 1. CONFIGURATION
# =========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

BACKEND_DATASET_PATH = os.path.join(BASE_DIR, "dataset.csv")
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
DATA_DATASET_PATH = os.path.join(DATA_DIR, "dataset.csv")

NUMBER_OF_STUDENTS = 2000
random.seed(42)

# =========================================================
# 2. DOMAIN POOLS
# =========================================================

BRANCHES = [
    "CSE",
    "IT",
    "ECE",
    "EEE",
    "MECH",
    "CIVIL"
]

AVAILABLE_SKILLS = [
    "Python",
    "Java",
    "C++",
    "JavaScript",
    "React",
    "SQL",
    "HTML",
    "CSS",
    "Machine Learning",
    "Data Science"
]

SKILL_LEVELS = [
    "Beginner",
    "Intermediate",
    "Advanced"
]


def generate_skills():
    """Generate 2-5 random technical skills formatted as Skill:Level;Skill:Level."""
    num_skills = random.randint(2, 5)
    selected_skills = random.sample(AVAILABLE_SKILLS, num_skills)
    skills = []

    for skill in selected_skills:
        level = random.choices(SKILL_LEVELS, weights=[30, 45, 25])[0]
        skills.append(f"{skill}:{level}")

    return ";".join(skills)


# =========================================================
# 3. GENERATE STUDENT RECORDS
# =========================================================

def generate_dataset():
    students = []

    for _ in range(NUMBER_OF_STUDENTS):
        # Academic metrics
        cgpa = round(random.uniform(5.0, 10.0), 2)
        attendance = round(random.uniform(55.0, 100.0), 2)
        backlogs = random.choices([0, 1, 2, 3, 4, 5], weights=[48, 24, 14, 8, 4, 2])[0]

        # Practical experience & assessments
        internships = random.choices([0, 1, 2, 3, 4], weights=[38, 36, 18, 6, 2])[0]
        projects = random.randint(0, 6)
        certifications = random.randint(0, 8)

        aptitude_score = round(random.uniform(35.0, 100.0), 2)
        coding_score = round(random.uniform(30.0, 100.0), 2)
        technical_skills_score = round(random.uniform(35.0, 100.0), 2)
        communication_score = round(random.uniform(40.0, 100.0), 2)

        branch = random.choice(BRANCHES)
        skills = generate_skills()

        # Placement score calculation for ground truth labelling
        placement_score = (
            (cgpa * 8.5)
            + (attendance * 0.15)
            - (backlogs * 10.0)
            + (internships * 9.0)
            + (projects * 3.5)
            + (certifications * 1.5)
            + (aptitude_score * 0.20)
            + (coding_score * 0.25)
            + (technical_skills_score * 0.20)
            + (communication_score * 0.12)
            + random.uniform(-10.0, 10.0)
        )

        placement = 1 if placement_score >= 125.0 else 0

        students.append({
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
            "skills": skills,
            "placement": placement
        })

    df = pd.DataFrame(students)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    # Save to backend/dataset.csv
    df.to_csv(BACKEND_DATASET_PATH, index=False)
    print(f"Saved dataset with {len(df)} records to {BACKEND_DATASET_PATH}")

    # Also save copy to data/dataset.csv if data folder exists
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(DATA_DATASET_PATH, index=False)
    print(f"Synced dataset copy to {DATA_DATASET_PATH}")

    placed_pct = round(df['placement'].mean() * 100, 2)
    print(f"Placement Distribution: {placed_pct}% Placed, {round(100 - placed_pct, 2)}% Not Placed")
    return df


if __name__ == "__main__":
    generate_dataset()