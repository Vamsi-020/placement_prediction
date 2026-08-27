import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { THEMES } from "../context/ThemeContext";

function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    target_role: "Software Engineer",
    theme_preference: "dark",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { full_name, username, email, target_role, theme_preference, password, confirmPassword } = formData;

    if (!full_name || !username || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register({
        full_name,
        username,
        email,
        target_role,
        theme_preference,
        password,
      });
      navigate("/predict");
    } catch (err) {
      const msg =
        err.response?.data?.error || "Registration failed. Please check your details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card-container">
        <div className="card auth-card">
          <div className="auth-header">
            <div className="auth-logo-badge">🚀</div>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">
              Join to track your placement readiness, save simulation tests, and unlock AI career insights.
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="full_name">
                Full Name *
              </label>
              <div className="input-with-icon">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  className="form-input"
                  placeholder="e.g. Vicky Kumar"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Username *
                </label>
                <div className="input-with-icon">
                  <span className="input-icon">@</span>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-input"
                    placeholder="e.g. vicky_dev"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address *
                </label>
                <div className="input-with-icon">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    placeholder="e.g. vicky@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="target_role">
                  Target Career Role
                </label>
                <select
                  id="target_role"
                  name="target_role"
                  className="form-input"
                  value={formData.target_role}
                  onChange={handleChange}
                >
                  <option value="Software Engineer">Software Engineer (SDE)</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Data Scientist / AI Engineer">Data Scientist / AI Engineer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
                  <option value="Product Analyst">Product Analyst / QA</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="theme_preference">
                  Preferred Theme
                </label>
                <select
                  id="theme_preference"
                  name="theme_preference"
                  className="form-input"
                  value={formData.theme_preference}
                  onChange={handleChange}
                >
                  {THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password *
                </label>
                <div className="input-with-icon">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="form-input"
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm Password *
                </label>
                <div className="input-with-icon">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-input"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <span>Show passwords</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large btn-glow btn-block"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account & Get Started"}
            </button>
          </form>

          <div className="auth-footer">
            <span>Already have an account?</span>{" "}
            <Link to="/login" className="auth-link">
              Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
