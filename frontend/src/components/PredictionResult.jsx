import React, { useState } from "react";
import WhatIfSimulator from "./WhatIfSimulator";

function PredictionResult({ result, studentName, previousPrediction }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'whatif'

  if (!result) return null;

  const isPlaced = result.prediction === "Placed";
  const prob = result.probability;

  // Compute delta if previous prediction is available
  let probDelta = null;
  if (previousPrediction && previousPrediction.probability !== undefined) {
    probDelta = (prob - previousPrediction.probability).toFixed(1);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="result-container">
      {/* Tab Switcher */}
      <div className="result-tabs">
        <button
          className={`result-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Prediction Verdict
        </button>
        <button
          className={`result-tab ${activeTab === "whatif" ? "active" : ""}`}
          onClick={() => setActiveTab("whatif")}
        >
          ⚡ What-If Career Optimizer
        </button>
      </div>

      {activeTab === "overview" && (
        <div className={`card result-card ${isPlaced ? "result-placed" : "result-unplaced"}`}>
          {/* Header Banner */}
          <div className="result-header">
            <div className="result-status-group">
              <span className={`status-pill ${isPlaced ? "pill-success" : "pill-warning"}`}>
                {isPlaced ? "✨ HIGH PLACEMENT READINESS" : "⚠️ PROFILE ENHANCEMENT RECOMMENDED"}
              </span>
              <h2 className="result-headline">
                {isPlaced ? "Likely to be Placed" : "Needs Further Preparation"}
              </h2>
              <p className="result-student-tag">
                Analyzed for: <strong>{studentName || result.studentName || "Candidate"}</strong>
              </p>
            </div>

            <div className="result-score-gauge">
              <div className="gauge-circle">
                <svg viewBox="0 0 100 100" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`circle ${isPlaced ? "circle-placed" : "circle-warning"}`}
                    strokeDasharray={`${prob}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage">
                    {prob}%
                  </text>
                </svg>
              </div>
              <span className="gauge-label">Placement Probability</span>
            </div>
          </div>

          {/* Comparison with Previous Attempt */}
          {probDelta !== null && (
            <div className="history-compare-banner">
              <span className="compare-icon">📈</span>
              <div className="compare-text">
                <strong>Progress Delta vs Last Assessment:</strong>{" "}
                <span className={parseFloat(probDelta) >= 0 ? "text-success font-bold" : "text-danger font-bold"}>
                  {parseFloat(probDelta) >= 0 ? `+${probDelta}%` : `${probDelta}%`} Probability
                </span>{" "}
                (Previous: {previousPrediction.probability}%)
              </div>
            </div>
          )}

          {/* Key Metric Highlights */}
          <div className="result-metrics-grid">
            <div className="result-metric-card">
              <span className="metric-title">Model Confidence</span>
              <span className={`metric-val badge-${result.confidence.toLowerCase()}`}>
                {result.confidence}
              </span>
            </div>
            <div className="result-metric-card">
              <span className="metric-title">Database Synced</span>
              <span className="metric-val text-success">
                {result.saved_to_history ? "Saved to SQLite ✓" : "Guest Mode"}
              </span>
            </div>
            <div className="result-metric-card">
              <span className="metric-title">Backlog Status</span>
              <span className={`metric-val ${(result.inputData?.backlogs || 0) > 0 ? "text-danger" : "text-success"}`}>
                {(result.inputData?.backlogs || 0) > 0 ? `${result.inputData.backlogs} Active Backlog(s)` : "Clear (Zero Backlogs)"}
              </span>
            </div>
          </div>

          {/* Explainable AI: Feature Importance Breakdown */}
          {result.feature_importance && (
            <div className="feature-importance-box">
              <div className="box-title-row">
                <h3>🔍 Explainable AI: Factor Impact Breakdown</h3>
                <span className="badge-subtle">Decision Tree Feature Weights</span>
              </div>
              <p className="feature-help">
                Relative influence of your profile attributes on this placement assessment:
              </p>
              <div className="importance-bars">
                {Object.entries(result.feature_importance)
                  .sort((a, b) => b[1] - a[1])
                  .map(([feature, weight]) => {
                    const featureLabels = {
                      cgpa: "Academic CGPA",
                      skills: "Technical Skills",
                      internships: "Internship Experience",
                      communication: "Communication Skills",
                      backlogs: "Backlogs Penalty",
                    };
                    return (
                      <div key={feature} className="importance-row">
                        <div className="importance-info">
                          <span className="feature-title">
                            {featureLabels[feature] || feature.toUpperCase()}
                          </span>
                          <span className="feature-pct">{weight}%</span>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${Math.min(100, weight * 2.2)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Actionable Suggestions */}
          <div className="suggestions-box">
            <h3>🎯 Actionable Career Recommendations</h3>
            <ul className="suggestions-list">
              {result.suggestions &&
                result.suggestions.map((suggestion, index) => (
                  <li key={index} className="suggestion-item">
                    <span className="sugg-bullet">💡</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
            </ul>
          </div>

          {/* Print & Action Footer */}
          <div className="result-actions-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
            >
              🖨️ Export / Print Assessment Report
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab("whatif")}
            >
              ⚡ Test Improvements in What-If Simulator
            </button>
          </div>
        </div>
      )}

      {activeTab === "whatif" && (
        <WhatIfSimulator
          initialData={result.inputData || {}}
          baseProbability={result.probability}
        />
      )}
    </div>
  );
}

export default PredictionResult;
