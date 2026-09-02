import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Doughnut, Bar, Line, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { getPredictions } from "../services/api";
import { useAuth } from "../context/AuthContext";

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

function Analytics() {
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      if (isAuthenticated) {
        try {
          const res = await getPredictions(50);
          setHistory(res.predictions || []);
        } catch (err) {
          console.error("Failed to load predictions:", err);
        }
      } else {
        const local = JSON.parse(localStorage.getItem("predictionHistory")) || [];
        setHistory(
          local.map((item, idx) => ({
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
            created_at: item.date || `Test #${idx + 1}`,
          }))
        );
      }
      setLoading(false);
    };

    loadAnalytics();
  }, [isAuthenticated]);

  const placedCount = history.filter((h) => h.prediction === "Placed").length;
  const notPlacedCount = history.filter((h) => h.prediction === "Not Placed").length;

  const latest = history.length > 0 ? history[0] : null;

  // 1. Doughnut Chart: Placed vs Needs Attention
  const doughnutData = {
    labels: ["Placed", "Needs Improvement"],
    datasets: [
      {
        data: [placedCount, notPlacedCount],
        backgroundColor: ["#10b981", "#f59e0b"],
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
    ],
  };

  // 2. Timeline Line Chart: Probability progression over attempts (chronological)
  const chronological = [...history].reverse();
  const lineLabels = chronological.map((h, i) =>
    h.created_at ? h.created_at.slice(5, 10) : `Run ${i + 1}`
  );
  const lineData = {
    labels: lineLabels.length > 0 ? lineLabels : ["Run 1"],
    datasets: [
      {
        label: "Placement Probability (%)",
        data: chronological.map((h) => h.probability),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        fill: true,
        tension: 0.35,
        pointBackgroundColor: "#60a5fa",
        pointRadius: 5,
      },
    ],
  };

  // 3. Radar Chart: Multi-factor Profile Balance
  const radarData = {
    labels: [
      "Academics (CGPA)",
      "Technical Skills",
      "Communication",
      "Internships",
      "Zero-Backlogs",
    ],
    datasets: [
      {
        label: latest ? latest.student_name : "Your Profile",
        data: latest
          ? [
              latest.cgpa * 10,
              latest.skills * 10,
              latest.communication * 10,
              Math.min(100, latest.internships * 35),
              latest.backlogs === 0 ? 100 : Math.max(0, 100 - latest.backlogs * 30),
            ]
          : [0, 0, 0, 0, 0],
        backgroundColor: "rgba(139, 92, 246, 0.25)",
        borderColor: "#8b5cf6",
        pointBackgroundColor: "#c084fc",
      },
      {
        label: "Benchmark Target",
        data: [80, 80, 75, 70, 100],
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "#10b981",
        borderDash: [4, 4],
        pointBackgroundColor: "#10b981",
      },
    ],
  };

  // 4. Bar Chart: Candidate vs Placement Target
  const barData = {
    labels: ["CGPA (x10)", "Skills (x10)", "Communication (x10)", "Internships (x25)"],
    datasets: [
      {
        label: latest ? `${latest.student_name} (Latest)` : "Current Profile",
        data: latest
          ? [
              latest.cgpa * 10,
              latest.skills * 10,
              latest.communication * 10,
              latest.internships * 25,
            ]
          : [0, 0, 0, 0],
        backgroundColor: "#6366f1",
        borderRadius: 8,
      },
      {
        label: "Placed Candidates Average",
        data: [82, 85, 78, 50],
        backgroundColor: "rgba(148, 163, 184, 0.3)",
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "rgba(255, 255, 255, 0.8)",
          font: { family: "Inter, sans-serif" },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(255, 255, 255, 0.06)" },
        ticks: { color: "rgba(255, 255, 255, 0.6)" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "rgba(255, 255, 255, 0.6)" },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "rgba(255, 255, 255, 0.8)",
          font: { family: "Inter, sans-serif" },
        },
      },
    },
    scales: {
      r: {
        angleLines: { color: "rgba(255, 255, 255, 0.1)" },
        grid: { color: "rgba(255, 255, 255, 0.08)" },
        pointLabels: {
          color: "rgba(255, 255, 255, 0.85)",
          font: { size: 12, family: "Inter, sans-serif" },
        },
        ticks: { display: false, max: 100, beginAtZero: true },
      },
    },
  };

  return (
    <div className="page analytics-page">
      <div className="analytics-header">
        <div>
          <h1 className="page-title">Career Intelligence & Analytics</h1>
          <p className="page-subtitle">
            Visual analysis of placement probabilities, factor balances, and career trajectories over time.
          </p>
        </div>
        <Link to="/predict" className="btn btn-primary">
          + Run Assessment
        </Link>
      </div>

      {loading ? (
        <div className="loading-state">🔄 Computing analytics models...</div>
      ) : history.length === 0 ? (
        <div className="card placeholder-state">
          <span className="placeholder-icon">📈</span>
          <h3>No Prediction Data Available</h3>
          <p>Make a prediction first to generate deep career analytics and visualizations.</p>
          <Link to="/predict" className="btn btn-primary mt-4">
            Take Assessment
          </Link>
        </div>
      ) : (
        <div className="analytics-grid">
          {/* Timeline Chart */}
          <div className="card chart-card full-width-chart">
            <div className="chart-header">
              <div>
                <h3>Placement Probability Progression</h3>
                <p className="chart-sub">How your placement odds evolved across multiple tests</p>
              </div>
              <span className="badge-pill badge-primary">
                {chronological.length} Recorded Attempts
              </span>
            </div>
            <div className="chart-canvas-container" style={{ height: "300px" }}>
              <Line data={lineData} options={chartOptions} />
            </div>
          </div>

          {/* Radar Chart */}
          <div className="card chart-card">
            <div className="chart-header">
              <div>
                <h3>Multi-Factor Balance Radar</h3>
                <p className="chart-sub">Latest attempt vs industry benchmark</p>
              </div>
            </div>
            <div className="chart-canvas-container" style={{ height: "300px" }}>
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>

          {/* Bar Chart */}
          <div className="card chart-card">
            <div className="chart-header">
              <div>
                <h3>Factor Comparison vs Placed Average</h3>
                <p className="chart-sub">Normalized metric scores (0 - 100)</p>
              </div>
            </div>
            <div className="chart-canvas-container" style={{ height: "300px" }}>
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="card chart-card">
            <div className="chart-header">
              <div>
                <h3>Overall Outcome Distribution</h3>
                <p className="chart-sub">Ratio of placed vs at-risk tests</p>
              </div>
            </div>
            <div className="chart-canvas-container" style={{ height: "260px" }}>
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: "rgba(255,255,255,0.8)" },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;
