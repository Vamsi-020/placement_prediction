import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function PredictionForm({ onPredict, loading, initialValues }) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    studentName: "",
    cgpa: "",
    attendance: "",
    backlogs: "",
    internships: "",
    projects: "",
    certifications: "",
    aptitude_score: "",
    coding_score: "",
    technical_skills_score: "",
    communication: "",
    branch: "",
    skills: "",
  });

  const [errors, setErrors] = useState({});

  // Sync initial values or logged-in user profile
  useEffect(() => {
    if (initialValues) {
      setFormData((prev) => ({
        ...prev,
        ...initialValues,
      }));
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        studentName: prev.studentName || user.full_name || user.username || "",
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

  // Quick fill preset profiles
  const applyPreset = (preset) => {
    const presets = {
      top: {
        cgpa: "9.0",
        attendance: "95",
        backlogs: "0",
        internships: "2",
        projects: "4",
        certifications: "5",
        aptitude_score: "90",
        coding_score: "88",
        technical_skills_score: "90",
        communication: "85",
        branch: "CSE",
        skills: "Python:Advanced;Java:Advanced;SQL:Intermediate;JavaScript:Intermediate",
      },
      average: {
        cgpa: "7.5",
        attendance: "85",
        backlogs: "0",
        internships: "1",
        projects: "2",
        certifications: "2",
        aptitude_score: "70",
        coding_score: "68",
        technical_skills_score: "70",
        communication: "70",
        branch: "CSE",
        skills: "Python:Intermediate;Java:Intermediate;SQL:Beginner",
      },
      critical: {
        cgpa: "5.8",
        attendance: "65",
        backlogs: "2",
        internships: "0",
        projects: "0",
        certifications: "0",
        aptitude_score: "45",
        coding_score: "40",
        technical_skills_score: "45",
        communication: "50",
        branch: "CSE",
        skills: "Python:Beginner;Java:Beginner",
      },
    };

    if (presets[preset]) {
      setFormData((prev) => ({
        ...prev,
        ...presets[preset],
        studentName: prev.studentName || (user ? user.full_name || user.username : "Sample Candidate"),
      }));
      setErrors({});
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName = "Student name is required.";
    }

    const cgpa = parseFloat(formData.cgpa);
    if (formData.cgpa === "" || isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      newErrors.cgpa = "Enter CGPA between 0 and 10.";
    }

    const attendance = parseFloat(formData.attendance);
    if (formData.attendance === "" || isNaN(attendance) || attendance < 0 || attendance > 100) {
      newErrors.attendance = "Enter attendance between 0 and 100.";
    }

    const backlogs = parseInt(formData.backlogs, 10);
    if (formData.backlogs === "" || isNaN(backlogs) || backlogs < 0) {
      newErrors.backlogs = "Enter 0 or more backlogs.";
    }

    const internships = parseInt(formData.internships, 10);
    if (formData.internships === "" || isNaN(internships) || internships < 0) {
      newErrors.internships = "Enter 0 or more internships.";
    }

    const projects = parseInt(formData.projects, 10);
    if (formData.projects === "" || isNaN(projects) || projects < 0) {
      newErrors.projects = "Enter 0 or more projects.";
    }

    const certifications = parseInt(formData.certifications, 10);
    if (formData.certifications === "" || isNaN(certifications) || certifications < 0) {
      newErrors.certifications = "Enter 0 or more certifications.";
    }

    const aptitude = parseFloat(formData.aptitude_score);
    if (formData.aptitude_score === "" || isNaN(aptitude) || aptitude < 0 || aptitude > 100) {
      newErrors.aptitude_score = "Enter aptitude score between 0 and 100.";
    }

    const coding = parseFloat(formData.coding_score);
    if (formData.coding_score === "" || isNaN(coding) || coding < 0 || coding > 100) {
      newErrors.coding_score = "Enter coding score between 0 and 100.";
    }

    const technical = parseFloat(formData.technical_skills_score);
    if (formData.technical_skills_score === "" || isNaN(technical) || technical < 0 || technical > 100) {
      newErrors.technical_skills_score = "Enter technical score between 0 and 100.";
    }

    const communication = parseFloat(formData.communication);
    if (formData.communication === "" || isNaN(communication) || communication < 0 || communication > 100) {
      newErrors.communication = "Enter communication score between 0 and 100.";
    }

    if (!formData.branch.trim()) {
      newErrors.branch = "Please select your branch.";
    }

    if (!formData.skills.trim()) {
      newErrors.skills = "Please enter at least one skill.";
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
      attendance: parseFloat(formData.attendance),
      backlogs: parseInt(formData.backlogs, 10),
      internships: parseInt(formData.internships, 10),
      projects: parseInt(formData.projects, 10),
      certifications: parseInt(formData.certifications, 10),
      aptitude_score: parseFloat(formData.aptitude_score),
      coding_score: parseFloat(formData.coding_score),
      technical_skills_score: parseFloat(formData.technical_skills_score),
      communication_score: parseFloat(formData.communication),
      branch: formData.branch.trim(),
      skills: formData.skills.trim(),
    });
  };

  return (
    <div className="card form-card">
      <div className="form-card-header">
        <div>
          <h2 className="form-card-title">Student Placement Profile</h2>
          <p className="form-card-subtitle">
            Enter academic metrics, internships, projects, and technical ratings.
          </p>
        </div>

        <div className="presets-wrapper">
          <span className="preset-label">Quick Fill:</span>
          <div className="preset-chips">
            <button
              type="button"
              className="chip chip-success"
              onClick={() => applyPreset("top")}
            >
              ⭐ Top Tier
            </button>
            <button
              type="button"
              className="chip chip-primary"
              onClick={() => applyPreset("average")}
            >
              🎯 Balanced
            </button>
            <button
              type="button"
              className="chip chip-danger"
              onClick={() => applyPreset("critical")}
            >
              ⚠️ At Risk
            </button>
          </div>
        </div>
      </div>

      <form className="prediction-form" onSubmit={handleSubmit}>
        {/* Student Name */}
        <div className="form-group">
          <label htmlFor="studentName" className="form-label">
            Candidate / Student Name
          </label>
          <input
            type="text"
            id="studentName"
            name="studentName"
            placeholder="e.g. Vicky Kumar"
            value={formData.studentName}
            onChange={handleChange}
            className={`form-input ${errors.studentName ? "input-error" : ""}`}
          />
          {errors.studentName && <span className="error-text">{errors.studentName}</span>}
        </div>

        {/* CGPA + Attendance */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cgpa" className="form-label">
              📊 CGPA (0 - 10)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              id="cgpa"
              name="cgpa"
              placeholder="e.g. 8.5"
              value={formData.cgpa}
              onChange={handleChange}
              className={`form-input ${errors.cgpa ? "input-error" : ""}`}
            />
            {errors.cgpa && <span className="error-text">{errors.cgpa}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="attendance" className="form-label">
              🎯 Attendance (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              id="attendance"
              name="attendance"
              placeholder="e.g. 85"
              value={formData.attendance}
              onChange={handleChange}
              className={`form-input ${errors.attendance ? "input-error" : ""}`}
            />
            {errors.attendance && <span className="error-text">{errors.attendance}</span>}
          </div>
        </div>

        {/* Backlogs + Internships */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="backlogs" className="form-label">
              ⚠️ Backlogs
            </label>
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
            {errors.backlogs && <span className="error-text">{errors.backlogs}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="internships" className="form-label">
              💼 Internships
            </label>
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
            {errors.internships && <span className="error-text">{errors.internships}</span>}
          </div>
        </div>

        {/* Projects + Certifications */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="projects" className="form-label">
              🚀 Projects Completed
            </label>
            <input
              type="number"
              min="0"
              id="projects"
              name="projects"
              placeholder="e.g. 3"
              value={formData.projects}
              onChange={handleChange}
              className={`form-input ${errors.projects ? "input-error" : ""}`}
            />
            {errors.projects && <span className="error-text">{errors.projects}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="certifications" className="form-label">
              🏆 Certifications
            </label>
            <input
              type="number"
              min="0"
              id="certifications"
              name="certifications"
              placeholder="e.g. 3"
              value={formData.certifications}
              onChange={handleChange}
              className={`form-input ${errors.certifications ? "input-error" : ""}`}
            />
            {errors.certifications && <span className="error-text">{errors.certifications}</span>}
          </div>
        </div>

        {/* Aptitude + Coding */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="aptitude_score" className="form-label">
              📝 Aptitude Score (0 - 100)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              id="aptitude_score"
              name="aptitude_score"
              placeholder="e.g. 80"
              value={formData.aptitude_score}
              onChange={handleChange}
              className={`form-input ${errors.aptitude_score ? "input-error" : ""}`}
            />
            {errors.aptitude_score && <span className="error-text">{errors.aptitude_score}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="coding_score" className="form-label">
              💻 Coding Score (0 - 100)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              id="coding_score"
              name="coding_score"
              placeholder="e.g. 75"
              value={formData.coding_score}
              onChange={handleChange}
              className={`form-input ${errors.coding_score ? "input-error" : ""}`}
            />
            {errors.coding_score && <span className="error-text">{errors.coding_score}</span>}
          </div>
        </div>

        {/* Technical + Communication */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="technical_skills_score" className="form-label">
              🧠 Technical Skills Score (0 - 100)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              id="technical_skills_score"
              name="technical_skills_score"
              placeholder="e.g. 80"
              value={formData.technical_skills_score}
              onChange={handleChange}
              className={`form-input ${errors.technical_skills_score ? "input-error" : ""}`}
            />
            {errors.technical_skills_score && (
              <span className="error-text">{errors.technical_skills_score}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="communication" className="form-label">
              🗣️ Communication Score (0 - 100)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              id="communication"
              name="communication"
              placeholder="e.g. 80"
              value={formData.communication}
              onChange={handleChange}
              className={`form-input ${errors.communication ? "input-error" : ""}`}
            />
            {errors.communication && <span className="error-text">{errors.communication}</span>}
          </div>
        </div>

        {/* Branch */}
        <div className="form-group">
          <label htmlFor="branch" className="form-label">
            🏫 Branch / Department
          </label>
          <select
            id="branch"
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            className={`form-input ${errors.branch ? "input-error" : ""}`}
          >
            <option value="">Select your branch</option>
            <option value="CSE">Computer Science Engineering (CSE)</option>
            <option value="IT">Information Technology (IT)</option>
            <option value="ECE">Electronics & Communication (ECE)</option>
            <option value="EEE">Electrical & Electronics (EEE)</option>
            <option value="MECH">Mechanical Engineering (MECH)</option>
            <option value="CIVIL">Civil Engineering (CIVIL)</option>
            <option value="AIML">Artificial Intelligence & ML (AIML)</option>
            <option value="DS">Data Science (DS)</option>
            <option value="Other">Other</option>
          </select>
          {errors.branch && <span className="error-text">{errors.branch}</span>}
        </div>

        {/* Skills */}
        <div className="form-group">
          <label htmlFor="skills" className="form-label">
            💻 Programming / Technical Skills
          </label>
          <input
            type="text"
            id="skills"
            name="skills"
            placeholder="Python:Advanced; Java:Intermediate; SQL:Beginner"
            value={formData.skills}
            onChange={handleChange}
            className={`form-input ${errors.skills ? "input-error" : ""}`}
          />
          <small className="form-help">
            Format: <code>Skill:Level; Skill:Level</code> (e.g. Python:Advanced; SQL:Intermediate)
          </small>
          {errors.skills && <span className="error-text">{errors.skills}</span>}
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-large btn-glow btn-block"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading-content">
                <span className="spinner"></span>
                Evaluating Profile with AI Model...
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