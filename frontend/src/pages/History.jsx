import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPredictions, deletePrediction } from "../services/api";

function History() {
  const { isAuthenticated } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'Placed' | 'Not Placed'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    if (isAuthenticated) {
      try {
        const data = await getPredictions(100);
        setPredictions(data.predictions || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error("Failed to load backend predictions:", err);
      }
    } else {
      const local = JSON.parse(localStorage.getItem("predictionHistory")) || [];
      const formatted = local.map((item, idx) => ({
        id: idx + 1,
        student_name: item.studentName || "Guest Student",
        prediction: item.prediction,
        probability: item.probability,
        confidence: item.confidence,
        cgpa: item.cgpa,
        internships: item.internships,
        skills: item.skills,
        communication: item.communication,
        backlogs: item.backlogs,
        created_at: item.date || "Recent",
        suggestions: item.suggestions || [],
      }));
      setPredictions(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [isAuthenticated]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prediction record?")) return;

    if (isAuthenticated) {
      try {
        await deletePrediction(id);
        setPredictions((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        alert("Failed to delete record.");
      }
    } else {
      const local = JSON.parse(localStorage.getItem("predictionHistory")) || [];
      const updated = local.filter((_, idx) => idx + 1 !== id);
      localStorage.setItem("predictionHistory", JSON.stringify(updated));
      setPredictions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const toggleSelectForCompare = (item) => {
    if (selectedForCompare.some((p) => p.id === item.id)) {
      setSelectedForCompare((prev) => prev.filter((p) => p.id !== item.id));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], item]);
      } else {
        setSelectedForCompare((prev) => [...prev, item]);
      }
    }
  };

  const filteredPredictions = predictions.filter((p) => {
    const matchesFilter = filter === "all" || p.prediction === filter;
    const matchesSearch =
      (p.student_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.probability.toString().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page history-page">
      <div className="history-header">
        <div>
          <h1 className="page-title">Prediction History & Logs</h1>
          <p className="page-subtitle">
            Track your past assessments, analyze improvements over time, and compare attempts.
          </p>
        </div>

        <div className="history-header-actions">
          {selectedForCompare.length === 2 && (
            <button
              type="button"
              className="btn btn-primary btn-glow"
              onClick={() => setCompareModalOpen(true)}
            >
              🔄 Compare 2 Selected Runs
            </button>
          )}
          <Link to="/predict" className="btn btn-primary">
            + New Prediction
          </Link>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="guest-banner">
          <span>💡 <strong>Guest Mode:</strong> Your history is stored in local browser cache.</span>{" "}
          <Link to="/register" className="auth-link font-bold">
            Sign up / Log in
          </Link>{" "}
          <span>to save history permanently in SQLite and access advanced comparison analytics!</span>
        </div>
      )}

      {/* Summary KPI Strip */}
      {predictions.length > 0 && (
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <span className="stat-card-label">Total Predictions</span>
            <span className="stat-card-value">{predictions.length}</span>
          </div>

          <div className="stat-card">
            <span className="stat-card-label">Placement Rate</span>
            <span className="stat-card-value text-success">
              {stats?.placement_rate !== undefined
                ? `${stats.placement_rate}%`
                : `${Math.round(
                    (predictions.filter((p) => p.prediction === "Placed").length /
                      predictions.length) *
                      100
                  )}%`}
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-card-label">Latest Probability</span>
            <span className="stat-card-value">
              {predictions[0]?.probability}%
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-card-label">Peak Score</span>
            <span className="stat-card-value text-primary">
              {Math.max(...predictions.map((p) => p.probability))}%
            </span>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="history-controls-card card">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search candidate name or probability..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          <button
            type="button"
            className={`filter-chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({predictions.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${filter === "Placed" ? "active" : ""}`}
            onClick={() => setFilter("Placed")}
          >
            ✅ Placed ({predictions.filter((p) => p.prediction === "Placed").length})
          </button>
          <button
            type="button"
            className={`filter-chip ${filter === "Not Placed" ? "active" : ""}`}
            onClick={() => setFilter("Not Placed")}
          >
            ⚠️ Needs Attention ({predictions.filter((p) => p.prediction === "Not Placed").length})
          </button>
        </div>
      </div>

      {/* History Table / List */}
      {loading ? (
        <div className="loading-state">🔄 Fetching prediction logs...</div>
      ) : filteredPredictions.length === 0 ? (
        <div className="card placeholder-state">
          <span className="placeholder-icon">📜</span>
          <h3>No Prediction History Found</h3>
          <p>
            {searchTerm || filter !== "all"
              ? "No records matched your search or filter."
              : "You haven't run any placement predictions yet."}
          </p>
          <Link to="/predict" className="btn btn-primary mt-4">
            🚀 Run Your First Prediction
          </Link>
        </div>
      ) : (
        <div className="card table-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>Compare</th>
                  <th>Candidate</th>
                  <th>Verdict</th>
                  <th>Placement Probability</th>
                  <th>CGPA</th>
                  <th>Internships</th>
                  <th>Skills / Comm</th>
                  <th>Backlogs</th>
                  <th>Date Recorded</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPredictions.map((item, idx) => {
                  const isPlaced = item.prediction === "Placed";
                  const isSelected = selectedForCompare.some((p) => p.id === item.id);
                  const prevItem = filteredPredictions[idx + 1];
                  const probChange = prevItem ? (item.probability - prevItem.probability).toFixed(1) : null;

                  return (
                    <tr key={item.id || idx} className={isSelected ? "row-selected" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectForCompare(item)}
                          title="Select to compare (choose 2)"
                        />
                      </td>
                      <td>
                        <strong className="candidate-name">{item.student_name}</strong>
                      </td>
                      <td>
                        <span className={`badge-pill ${isPlaced ? "badge-success" : "badge-warning"}`}>
                          {isPlaced ? "Placed" : "Not Placed"}
                        </span>
                      </td>
                      <td>
                        <div className="table-prob-cell">
                          <span className="prob-number">{item.probability}%</span>
                          {probChange !== null && (
                            <span
                              className={`change-tag ${
                                parseFloat(probChange) >= 0 ? "change-up" : "change-down"
                              }`}
                              title="Change vs prior attempt"
                            >
                              {parseFloat(probChange) >= 0 ? `+${probChange}%` : `${probChange}%`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{item.cgpa}</td>
                      <td>{item.internships}</td>
                      <td>
                        {item.skills} / {item.communication}
                      </td>
                      <td>
                        <span className={item.backlogs > 0 ? "text-danger font-bold" : "text-muted"}>
                          {item.backlogs}
                        </span>
                      </td>
                      <td className="text-muted text-sm">
                        {typeof item.created_at === "string"
                          ? item.created_at.slice(0, 16).replace("T", " ")
                          : "Recent"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-icon-danger"
                          onClick={() => handleDelete(item.id)}
                          title="Delete record"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {compareModalOpen && selectedForCompare.length === 2 && (
        <div className="modal-overlay" onClick={() => setCompareModalOpen(false)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Side-by-Side Comparison</h2>
              <button className="modal-close" onClick={() => setCompareModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="compare-grid">
              {/* Attempt 1 */}
              <div className="compare-col">
                <div className="compare-col-header">
                  <h3>Attempt A</h3>
                  <span className="text-sm text-muted">{selectedForCompare[0].created_at}</span>
                </div>
                <div className="compare-metric-row">
                  <span>Candidate:</span>
                  <strong>{selectedForCompare[0].student_name}</strong>
                </div>
                <div className="compare-metric-row">
                  <span>Verdict:</span>
                  <span className={`badge-pill ${selectedForCompare[0].prediction === "Placed" ? "badge-success" : "badge-warning"}`}>
                    {selectedForCompare[0].prediction}
                  </span>
                </div>
                <div className="compare-metric-row">
                  <span>Probability:</span>
                  <strong>{selectedForCompare[0].probability}%</strong>
                </div>
                <div className="compare-metric-row">
                  <span>CGPA:</span>
                  <strong>{selectedForCompare[0].cgpa}</strong>
                </div>
                <div className="compare-metric-row">
                  <span>Internships:</span>
                  <strong>{selectedForCompare[0].internships}</strong>
                </div>
                <div className="compare-metric-row">
                  <span>Technical Skills:</span>
                  <strong>{selectedForCompare[0].skills} / 10</strong>
                </div>
                <div className="compare-metric-row">
                  <span>Communication:</span>
                  <strong>{selectedForCompare[0].communication} / 10</strong>
                </div>
                <div className="compare-metric-row">
                  <span>Backlogs:</span>
                  <strong>{selectedForCompare[0].backlogs}</strong>
                </div>
              </div>

              {/* Difference Column */}
              <div className="compare-diff-col">
                <div className="diff-badge">Delta (B - A)</div>
                <div className="diff-item">
                  <span>Prob Change:</span>
                  <strong className={selectedForCompare[1].probability >= selectedForCompare[0].probability ? "text-success" : "text-danger"}>
                    {(selectedForCompare[1].probability - selectedForCompare[0].probability).toFixed(1)}%
                  </strong>
                </div>
                <div className="diff-item">
                  <span>CGPA Diff:</span>
                  <strong>{(selectedForCompare[1].cgpa - selectedForCompare[0].cgpa).toFixed(2)}</strong>
                </div>
                <div className="diff-item">
                  <span>Internships Diff:</span>
                  <strong>{selectedForCompare[1].internships - selectedForCompare[0].internships}</strong>
                </div>
                <div className="diff-item">
                  <span>Skills Diff:</span>
                  <strong>{(selectedForCompare[1].skills - selectedForCompare[0].skills).toFixed(1)}</strong>
                </div>
              </div>

              {/* Attempt 2 */}
              <div className="compare-col">
                <div className="compare-col-header">
                  <h3>Attempt B</h3>
                  <span className="text-sm text-muted">{selectedForCompare[1].created_at}</span>
                </div>
                <div className="compare-metric-row">
                  <span>Candidate:</span>
                  <strong>{selectedForCompare[1].student_name}</strong>
                </div>
                <div className="compare-metric-row">
                  <span>Verdict:</span>
                  <span className={`badge-pill ${selectedForCompare[1].prediction === "Placed" ? "badge-success" : "badge-warning"}`}>
                    {selectedForCompare[1].prediction}
                  </span>
                </div>
                <div className="compare-metric-row">
                  <span>Probability:</span>
                  <strong>{selectedForCompare[1].probability}%</strong>
                </div>
                <div className="compare-metric-row">
                  <span>CGPA:</span>
                  <strong>{selectedForCompare[1].cgpa}</strong>
                </div>
                <div className="compare-metric-row">
                  <span>Internships:</span>
                  <strong>{selectedForCompare[1].internships}</strong>
                </div>
                <div className="compare-metric-row">
                  <span>Technical Skills:</span>
                  <strong>{selectedForCompare[1].skills} / 10</strong>
                </div>
                <div className="compare-metric-row">
                  <span>Communication:</span>
                  <strong>{selectedForCompare[1].communication} / 10</strong>
                </div>
                <div className="compare-metric-row">
                  <span>Backlogs:</span>
                  <strong>{selectedForCompare[1].backlogs}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
