# AI Placement Prediction System

A simple, beginner-friendly full-stack Machine Learning web application that
predicts whether a student is likely to be **Placed** or **Not Placed**
based on academic performance, internships, technical skills, communication
skills, and backlogs.

## Tech Stack

**Frontend:** React.js, Vite, Plain CSS, React Router DOM, Axios, Chart.js
**Backend:** Python, Flask, Flask-CORS
**Machine Learning:** Pandas, Scikit-learn (RandomForestClassifier), Joblib

## Project Structure

```
placement-prediction-system/
├── frontend/     -> React + Vite application
├── backend/      -> Flask API + ML model
├── README.md
└── .gitignore
```

## Application Flow

```
Student Input → React Prediction Form → Axios API Request → Flask Backend
→ Random Forest ML Model → Placement Prediction → Probability + Confidence
+ Suggestions → React Result Page → Dashboard and Analytics
```

## Installation & Setup

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python model.py     # Trains the model and saves model.pkl + accuracy.txt
python app.py        # Starts the Flask server
```

The backend will run on: **http://localhost:5000**

### 2. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on: **http://localhost:5173**

> Make sure the backend is running before using the Predict page, otherwise
> the frontend will show a connection error.

## API Endpoints

| Method | Endpoint        | Description                          |
|--------|-----------------|---------------------------------------|
| GET    | `/api/health`   | Check if the backend is running       |
| POST   | `/api/predict`  | Predict placement from student data   |
| GET    | `/api/accuracy` | Get the trained model's accuracy      |

### Example `/api/predict` request

```json
{
  "cgpa": 8.2,
  "internships": 2,
  "skills": 8,
  "communication": 7,
  "backlogs": 0
}
```

### Example response

```json
{
  "prediction": "Placed",
  "probability": 82.0,
  "confidence": "High",
  "suggestions": [
    "Continue improving your skills and preparing for placement interviews."
  ],
  "feature_importance": {
    "cgpa": 24.5,
    "internships": 21.3,
    "skills": 20.1,
    "communication": 18.7,
    "backlogs": 15.4
  }
}
```

## Pages

- **Home** – Landing page introducing the project.
- **Predict** – Form to enter student details and get an AI prediction.
- **Dashboard** – Overview stats (total predictions, latest result, model accuracy).
- **Analytics** – Chart.js visualizations: placement distribution (doughnut chart)
  and the latest student's performance breakdown (bar chart).

## Notes

- No authentication, database, or complex backend architecture — this project
  is intentionally kept simple for a college project demonstration.
- Prediction history is stored in the browser's `localStorage`.
- The ML model only ever receives numeric features (`cgpa`, `internships`,
  `skills`, `communication`, `backlogs`) — the student's name is never sent
  to the model.

## Retraining the Model

If you update `backend/dataset.csv`, simply re-run:

```bash
cd backend
python model.py
```

This regenerates `model.pkl` and `accuracy.txt`.
