import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function PredictionForm({ onPredict, loading, initialValues }) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    studentName: "",
    cgpa: "",
    internships: "",
    skills: "",
    communication: "",
    backlogs: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        studentName: prev.studentName || user.full_name || user.username,
      }));
    }
  }, [user, initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const applyPreset = (preset) => {
    const presets = {
      top: {
        cgpa: "8.8",
        internships: "2",
        skills: "9.0",
        communication: "8.5",
        backlogs: "0",
      },
      average: {
        cgpa: "7.2",
        internships: "1",
        skills: "6.5",
        communication: "6.5",
        backlogs: "0",
      },
      critical: {
        cgpa: "5.8",
        internships: "0",
        skills: "4.5",
        communication: "4.0",
        backlogs: "2",
      },
    };

    if (presets[preset]) {
      setFormData((prev) => ({
        ...prev,
        ...presets[preset],
        studentName: prev.studentName || (user ? user.full_name : "Sample Candidate"),
      }));
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName = "Candidate/Student name is required.";
    }

    const cgpa = parseFloat(formData.cgpa);
    if (formData.cgpa === "" || isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      newErrors.cgpa = "Enter a valid CGPA between 0.0 and 10.0.";
    }

    const internships = parseInt(formData.internships, 10);
    if (formData.internships === "" || isNaN(internships) || internships < 0) {
      newErrors.internships = "Enter valid number of internships (0 or more).";
    }

    const skills = parseFloat(formData.skills);
    if (formData.skills === "" || isNaN(skills) || skills < 1 || skills > 10) {
      newErrors.skills = "Enter a technical skills score between 1 and 10.";
    }

    const communication = parseFloat(formData.communication);
    if (
      formData.communication === "" ||
      isNaN(communication) ||
      communication < 1 ||
      communication > 10
    ) {
      newErrors.communication = "Enter a communication score between 1 and 10.";
    }

    const backlogs = parseInt(formData.backlogs, 10);
    if (formData.backlogs === "" || isNaN(backlogs) || backlogs < 0) {
      newErrors.backlogs = "Enter valid active backlogs count (0 or more).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onPredict({
      studentName: formData.studentName.trim(),
      cgpa: parseFloat(formData.cgpa),
      internships: parseInt(formData.internships, 10),
      skills: parseFloat(formData.skills),
      communication: parseFloat(formData.communication),
      backlogs: parseInt(formData.backlogs, 10),
    });
  };

  return (
    <div className="card form-card">
      <div className="form-card-header">
        <div>
          <h2 className="form-card-title">Candidate Profile</h2>
          <p className="form-card-subtitle">
            Enter academic, skill metrics and internship counts.
          </p>
        </div>
        <div className="presets-wrapper">
          <span className="preset-label">Quick Fill:</span>
          <div className="preset-chips">
            <button
              type="button"
              className="chip chip-success"
              onClick={() => applyPreset("top")}
              title="Fill high achiever profile"
            >
              ⭐ Top Tier
            </button>
            <button
              type="button"
              className="chip chip-primary"
              onClick={() => applyPreset("average")}
              title="Fill average student profile"
            >
              🎯 Balanced
            </button>
            <button
              type="button"
              className="chip chip-danger"
              onClick={() => applyPreset("critical")}
              title="Fill profile needing improvement"
            >
              ⚠️ At Risk
            </button>
          </div>
        </div>
      </div>

      <form className="prediction-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="studentName" className="form-label">
            Student / Candidate Name
          </label>
          <div className="input-with-icon">
            <span className="input-icon">👤</span>
            <input
              type="text"
              id="studentName"
              name="studentName"
              placeholder="e.g. Alex Morgan"
              value={formData.studentName}
              onChange={handleChange}
              className={`form-input ${errors.studentName ? "input-error" : ""}`}
            />
          </div>
          {errors.studentName && <span className="error-text">{errors.studentName}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cgpa" className="form-label">
              Cumulative CGPA (0 - 10)
            </label>
            <div className="input-with-icon">
              <span className="input-icon">📊</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                id="cgpa"
                name="cgpa"
                placeholder="e.g. 8.4"
                value={formData.cgpa}
                onChange={handleChange}
                className={`form-input ${errors.cgpa ? "input-error" : ""}`}
              />
            </div>
            {errors.cgpa && <span className="error-text">{errors.cgpa}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="internships" className="form-label">
              Completed Internships
            </label>
            <div className="input-with-icon">
              <span className="input-icon">💼</span>
              <input
                type="number"
                min="0"
                id="internships"
                name="internships"
                placeholder="e.g. 2"
                value={formData.internships}
                onChange={handleChange}
                className={`form-input ${errors.internships ? "input-error" : ""}`}
              />
            </div>
            {errors.internships && (
              <span className="error-text">{errors.internships}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="skills" className="form-label">
              Technical & DSA Skills (1 - 10)
            </label>
            <div className="input-with-icon">
              <span className="input-icon">💻</span>
              <input
                type="number"
                step="0.5"
                min="1"
                max="10"
                id="skills"
                name="skills"
                placeholder="e.g. 8.0"
                value={formData.skills}
                onChange={handleChange}
                className={`form-input ${errors.skills ? "input-error" : ""}`}
              />
            </div>
            {errors.skills && <span className="error-text">{errors.skills}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="communication" className="form-label">
              Communication & Interview (1 - 10)
            </label>
            <div className="input-with-icon">
              <span className="input-icon">🗣️</span>
              <input
                type="number"
                step="0.5"
                min="1"
                max="10"
                id="communication"
                name="communication"
                placeholder="e.g. 7.5"
                value={formData.communication}
                onChange={handleChange}
                className={`form-input ${errors.communication ? "input-error" : ""}`}
              />
            </div>
            {errors.communication && (
              <span className="error-text">{errors.communication}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="backlogs" className="form-label">
            Active Backlogs Count
          </label>
          <div className="input-with-icon">
            <span className="input-icon">⚠️</span>
            <input
              type="number"
              min="0"
              id="backlogs"
              name="backlogs"
              placeholder="e.g. 0"
              value={formData.backlogs}
              onChange={handleChange}
              className={`form-input ${errors.backlogs ? "input-error" : ""}`}
            />
          </div>
          {errors.backlogs && <span className="error-text">{errors.backlogs}</span>}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-large btn-glow btn-block"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading-content">
                <span className="spinner"></span> Running AI Prediction...
              </span>
            ) : (
              <span>🚀 Run Placement Prediction</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PredictionForm;
