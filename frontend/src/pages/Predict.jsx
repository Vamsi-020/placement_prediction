import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PredictionForm from "../components/PredictionForm";
import PredictionResult from "../components/PredictionResult";
import { predictPlacement, getPredictions } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Predict() {
  const { user, isAuthenticated } = useAuth();
  const [result, setResult] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previousPrediction, setPreviousPrediction] = useState(null);
  const [prefillData, setPrefillData] = useState(null);

  useEffect(() => {
    const fetchLatestUserPrediction = async () => {
      if (isAuthenticated) {
        try {
          const res = await getPredictions(1);
          if (res.predictions && res.predictions.length > 0) {
            setPreviousPrediction(res.predictions[0]);
          }
        } catch (err) {
          console.warn("Could not load prior prediction history:", err);
        }
      } else {
        const history = JSON.parse(localStorage.getItem("predictionHistory")) || [];
        if (history.length > 0) {
          setPreviousPrediction(history[history.length - 1]);
        }
      }
    };

    fetchLatestUserPrediction();
  }, [isAuthenticated]);

  const handlePrefillPrevious = () => {
    if (previousPrediction) {
      setPrefillData({
        studentName: previousPrediction.student_name || previousPrediction.studentName || (user ? user.full_name : ""),
        cgpa: (previousPrediction.cgpa !== undefined ? previousPrediction.cgpa : "").toString(),
        internships: (previousPrediction.internships !== undefined ? previousPrediction.internships : "").toString(),
        skills: (previousPrediction.skills !== undefined ? previousPrediction.skills : "").toString(),
        communication: (previousPrediction.communication !== undefined ? previousPrediction.communication : "").toString(),
        backlogs: (previousPrediction.backlogs !== undefined ? previousPrediction.backlogs : "").toString(),
      });
    }
  };

  const handlePredict = async (formData) => {
    setLoading(true);
    setError("");
    setResult(null);

    const { studentName: name, ...mlFeatures } = formData;
    setStudentName(name);

    try {
      const response = await predictPlacement({
        studentName: name,
        ...mlFeatures,
      });
      setResult(response);

      const history = JSON.parse(localStorage.getItem("predictionHistory")) || [];
      history.push({
        studentName: name,
        prediction: response.prediction,
        probability: response.probability,
        confidence: response.confidence,
        ...mlFeatures,
        date: new Date().toLocaleString(),
      });
      localStorage.setItem("predictionHistory", JSON.stringify(history));
    } catch (err) {
      const backendError = err.response?.data;
      setError(
        backendError?.details
          ? `${backendError.error || "Prediction failed"}: ${backendError.details}`
          : backendError?.error ||
            (err.message === "Network Error"
              ? "Could not connect to the backend server. Check the Render backend URL and CORS configuration."
              : "Prediction request failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page predict-page">
      <div className="predict-header">
        <h1 className="page-title">AI Placement Prediction Studio</h1>
        <p className="page-subtitle">
          Evaluate your placement readiness using our machine learning model trained on campus placement records.
        </p>
      </div>

      {previousPrediction && (
        <div className="returning-user-banner card">
          <div className="banner-icon">🎯</div>
          <div className="banner-content">
            <div className="banner-title-row">
              <h4>{user ? `Welcome back, ${user.full_name || user.username}!` : "Welcome back!"}</h4>
              <span className={`badge-pill ${previousPrediction.prediction === "Placed" ? "badge-success" : "badge-warning"}`}>
                Last Result: {previousPrediction.prediction} ({previousPrediction.probability}%)
              </span>
            </div>
            <p className="banner-text">
              We found your previous evaluation (CGPA: {previousPrediction.cgpa}, Skills: {previousPrediction.skills}/10, Internships: {previousPrediction.internships}).
              Test your updated profile to measure your improvement!
            </p>
          </div>
          <div className="banner-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrefillPrevious}>
              📋 Prefill Last Inputs
            </button>
            <Link to="/history" className="btn btn-ghost btn-sm">📜 View Full History</Link>
          </div>
        </div>
      )}

      <div className="predict-layout">
        <PredictionForm onPredict={handlePredict} loading={loading} initialValues={prefillData} />

        <div className="predict-output">
          {loading && (
            <div className="card loading-card">
              <div className="loading-spinner"></div>
              <h3>Analyzing Candidate Metrics...</h3>
              <p>Passing features through Random Forest Decision Trees & computing explainability scores.</p>
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}

          {result && !loading && (
            <PredictionResult result={result} studentName={studentName} previousPrediction={previousPrediction} />
          )}

          {!result && !loading && !error && (
            <div className="card placeholder-state">
              <div className="placeholder-art">🔮</div>
              <h3>Ready for Assessment</h3>
              <p>
                Fill in the candidate form on the left or use the <strong>Quick Fill Presets</strong> to run an instant placement probability analysis.
              </p>
              <div className="placeholder-highlights">
                <div className="ph-item">✨ 91.0% Accurate ML Model</div>
                <div className="ph-item">⚡ Instant What-If Career Simulator</div>
                <div className="ph-item">🔒 SQLite History & Trend Tracking</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Predict;
