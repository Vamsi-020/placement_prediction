import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAccuracy, getPredictions } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [accuracy, setAccuracy] = useState(91.0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const accData = await getAccuracy();
        if (accData.accuracy) setAccuracy(accData.accuracy);
      } catch (err) {
        console.warn("Could not fetch accuracy score:", err);
      }

      if (isAuthenticated) {
        try {
          const res = await getPredictions(5);
          setHistory(res.predictions || []);
          setStats(res.stats || null);
        } catch (err) {
          console.error("Failed to load user predictions:", err);
        }
      } else {
        const local = JSON.parse(localStorage.getItem("predictionHistory")) || [];
        setHistory(
          local.slice(-5).reverse().map((item, idx) => ({
            id: idx + 1,
            student_name: item.studentName || "Guest",
            prediction: item.prediction,
            probability: item.probability,
            confidence: item.confidence,
            cgpa: item.cgpa,
            internships: item.internships,
            skills: item.skills,
            communication: item.communication,
            backlogs: item.backlogs,
            created_at: item.date || "Recent",
          }))
        );
      }
      setLoading(false);
    };

    loadDashboardData();
  }, [isAuthenticated]);

  const latest = history.length > 0 ? history[0] : null;

  return (
    <div className="page dashboard-page">
      <div className="dashboard-hero card">
        <div className="hero-welcome">
          <div className="welcome-tag">
            <span>✨ AI Career Intelligence Dashboard</span>
          </div>
          <h1 className="hero-title">
            {isAuthenticated
              ? `Welcome back, ${user?.full_name || user?.username}!`
              : "Welcome to PlacementAI"}
          </h1>
          <p className="hero-subtitle">
            {isAuthenticated
              ? `Target Role: ${user?.target_role || "Software Engineer"} • Track your placement readiness and improvement trajectory.`
              : "Analyze student placement odds, run what-if simulations, and discover actionable preparation paths."}
          </p>
        </div>

        <div className="hero-cta-group">
          <Link to="/predict" className="btn btn-primary btn-large btn-glow">
            🚀 New Assessment
          </Link>
          <Link to="/history" className="btn btn-secondary">
            📜 View Logs
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid mb-6">
        <div className="stat-card">
          <span className="stat-card-label">Total Assessments</span>
          <span className="stat-card-value">
            {stats?.total_predictions !== undefined ? stats.total_predictions : history.length}
          </span>
          <span className="stat-card-footnote">Logged in database</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Placement Success Rate</span>
          <span className="stat-card-value text-success">
            {stats?.placement_rate !== undefined
              ? `${stats.placement_rate}%`
              : history.length > 0
              ? `${Math.round(
                  (history.filter((h) => h.prediction === "Placed").length / history.length) * 100
                )}%`
              : "—"}
          </span>
          <span className="stat-card-footnote">Classified as Placed</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Latest Probability</span>
          <span className="stat-card-value text-primary">
            {latest ? `${latest.probability}%` : "—"}
          </span>
          <span className="stat-card-footnote">
            {latest ? `Verdict: ${latest.prediction}` : "No tests yet"}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card-label">Model Accuracy</span>
          <span className="stat-card-value text-purple">
            {accuracy}%
          </span>
          <span className="stat-card-footnote">Random Forest Classifier</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Recent Activity Feed */}
        <div className="dashboard-col card">
          <div className="card-header-row">
            <div>
              <h3>Recent Predictions</h3>
              <p className="card-sub">Your latest evaluation attempts</p>
            </div>
            <Link to="/history" className="btn btn-sm btn-ghost">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="loading-state">Loading records...</div>
          ) : history.length === 0 ? (
            <div className="placeholder-state">
              <span>📊</span>
              <p>No prediction history yet. Run your first assessment!</p>
              <Link to="/predict" className="btn btn-primary btn-sm mt-3">
                Start Now
              </Link>
            </div>
          ) : (
            <div className="recent-list">
              {history.map((item, idx) => {
                const isPlaced = item.prediction === "Placed";
                return (
                  <div key={item.id || idx} className="recent-item">
                    <div className={`recent-status-dot ${isPlaced ? "dot-success" : "dot-warning"}`}></div>
                    <div className="recent-info">
                      <div className="recent-name-row">
                        <strong>{item.student_name}</strong>
                        <span className={`badge-pill ${isPlaced ? "badge-success" : "badge-warning"}`}>
                          {item.prediction} ({item.probability}%)
                        </span>
                      </div>
                      <div className="recent-meta">
                        <span>CGPA: {item.cgpa}</span>
                        <span>•</span>
                        <span>Skills: {item.skills}/10</span>
                        <span>•</span>
                        <span>Internships: {item.internships}</span>
                        <span>•</span>
                        <span>{item.created_at?.slice(0, 10)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Readiness Index & Recommendations */}
        <div className="dashboard-col card">
          <div className="card-header-row">
            <div>
              <h3>Career Readiness Matrix</h3>
              <p className="card-sub">Core factor benchmarks based on latest test</p>
            </div>
          </div>

          {latest ? (
            <div className="readiness-breakdown">
              <div className="readiness-item">
                <div className="readiness-label-row">
                  <span>Academic Standing (CGPA)</span>
                  <strong>{latest.cgpa} / 10</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill fill-primary"
                    style={{ width: `${Math.min(100, (latest.cgpa / 10) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="readiness-item">
                <div className="readiness-label-row">
                  <span>Technical & Coding Skills</span>
                  <strong>{latest.skills} / 10</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill fill-success"
                    style={{ width: `${Math.min(100, (latest.skills / 10) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="readiness-item">
                <div className="readiness-label-row">
                  <span>Communication & Interview Prep</span>
                  <strong>{latest.communication} / 10</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill fill-purple"
                    style={{ width: `${Math.min(100, (latest.communication / 10) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="readiness-item">
                <div className="readiness-label-row">
                  <span>Practical Experience (Internships)</span>
                  <strong>{latest.internships} Completed</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill fill-warning"
                    style={{ width: `${Math.min(100, (latest.internships / 3) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="dashboard-tips-box">
                <h4>🎯 Recommended Next Step:</h4>
                <p>
                  {latest.internships === 0
                    ? "Completing your first internship will generate the highest jump in placement probability."
                    : latest.skills < 7
                    ? "Focus on Data Structures and project deployment to boost your technical rating."
                    : "Your profile is strong! Keep practicing mock interview behavioral questions."}
                </p>
              </div>
            </div>
          ) : (
            <div className="placeholder-state">
              <p>Take an assessment to generate your personalized career readiness matrix.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
