import React, { useState } from "react";
import { predictPlacement } from "../services/api";

function WhatIfSimulator({ initialData = {}, baseProbability = 50 }) {
  const [simData, setSimData] = useState({
    cgpa: initialData.cgpa !== undefined ? initialData.cgpa : 7.5,
    internships: initialData.internships !== undefined ? initialData.internships : 1,
    skills: initialData.skills !== undefined ? initialData.skills : 7,
    communication: initialData.communication !== undefined ? initialData.communication : 7,
    backlogs: initialData.backlogs !== undefined ? initialData.backlogs : 0,
  });

  const [simResult, setSimResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const handleSliderChange = (field, value) => {
    const updated = { ...simData, [field]: value };
    setSimData(updated);
  };

  const runSimulation = async () => {
    setCalculating(true);
    try {
      const res = await predictPlacement({
        studentName: "Simulation Run",
        cgpa: parseFloat(simData.cgpa),
        internships: parseInt(simData.internships, 10),
        skills: parseFloat(simData.skills),
        communication: parseFloat(simData.communication),
        backlogs: parseInt(simData.backlogs, 10),
      });
      setSimResult(res);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setCalculating(false);
    }
  };

  const probDiff = simResult ? (simResult.probability - baseProbability).toFixed(1) : 0;

  return (
    <div className="whatif-container">
      <div className="whatif-header">
        <div className="whatif-title-group">
          <span className="whatif-badge">Interactive Simulator</span>
          <h3>What-If Career Optimizer</h3>
          <p className="whatif-desc">
            Simulate how improving your skills, earning internships, or raising CGPA affects your placement probability.
          </p>
        </div>
      </div>

      <div className="whatif-grid">
        {/* Sliders Area */}
        <div className="whatif-controls">
          <div className="slider-group">
            <div className="slider-label-row">
              <span>Target CGPA</span>
              <strong className="slider-val">{simData.cgpa} / 10</strong>
            </div>
            <input
              type="range"
              min="4.0"
              max="10.0"
              step="0.1"
              value={simData.cgpa}
              onChange={(e) => handleSliderChange("cgpa", parseFloat(e.target.value))}
              className="range-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-label-row">
              <span>Internships</span>
              <strong className="slider-val">{simData.internships} completed</strong>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={simData.internships}
              onChange={(e) => handleSliderChange("internships", parseInt(e.target.value, 10))}
              className="range-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-label-row">
              <span>Technical Skills (1-10)</span>
              <strong className="slider-val">{simData.skills} / 10</strong>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={simData.skills}
              onChange={(e) => handleSliderChange("skills", parseFloat(e.target.value))}
              className="range-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-label-row">
              <span>Communication Score (1-10)</span>
              <strong className="slider-val">{simData.communication} / 10</strong>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={simData.communication}
              onChange={(e) => handleSliderChange("communication", parseFloat(e.target.value))}
              className="range-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-label-row">
              <span>Backlogs</span>
              <strong className={`slider-val ${simData.backlogs > 0 ? "text-danger" : "text-success"}`}>
                {simData.backlogs} {simData.backlogs === 0 ? "(Clear)" : "active"}
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={simData.backlogs}
              onChange={(e) => handleSliderChange("backlogs", parseInt(e.target.value, 10))}
              className="range-input"
            />
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={runSimulation}
            disabled={calculating}
          >
            {calculating ? "⚡ Calculating Impact..." : "⚡ Recalculate Simulation"}
          </button>
        </div>

        {/* Simulation Output Card */}
        <div className="whatif-output">
          {simResult ? (
            <div className={`sim-result-box ${simResult.prediction === "Placed" ? "sim-success" : "sim-warning"}`}>
              <div className="sim-status">
                <span className="sim-verdict">{simResult.prediction.toUpperCase()}</span>
                <span className="sim-prob-badge">{simResult.probability}%</span>
              </div>

              <div className="sim-delta-row">
                <span>Change vs Current Test:</span>
                <strong className={`delta-tag ${probDiff >= 0 ? "delta-pos" : "delta-neg"}`}>
                  {probDiff >= 0 ? `+${probDiff}%` : `${probDiff}%`}
                </strong>
              </div>

              <div className="sim-meter">
                <div
                  className="sim-meter-fill"
                  style={{
                    width: `${simResult.probability}%`,
                    background: simResult.prediction === "Placed" ? "var(--color-success)" : "var(--color-danger)",
                  }}
                ></div>
              </div>

              <div className="sim-takeaways">
                <h4>Key Takeaway:</h4>
                <p>
                  {simData.backlogs > 0
                    ? "⚠️ Clearing remaining backlogs will drastically raise company eligibility."
                    : simData.internships >= 2
                    ? "✨ 2+ internships place you in the top tier of candidates!"
                    : "💡 Boosting both your DSA Skills and Mock Interviews gives the highest probability multiplier."}
                </p>
              </div>
            </div>
          ) : (
            <div className="sim-placeholder">
              <span className="sim-icon">🎯</span>
              <h4>Ready to Simulate</h4>
              <p>Adjust the sliders to test potential profile upgrades, then click calculate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WhatIfSimulator;
