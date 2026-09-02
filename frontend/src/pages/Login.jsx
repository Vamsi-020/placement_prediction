import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please fill in both email/username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(identifier, password);
      navigate("/predict");
    } catch (err) {
      const msg =
        err.response?.data?.error || "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setIdentifier("demouser");
    setPassword("password123");
    setLoading(true);
    setError("");
    try {
      await login("demouser", "password123");
      navigate("/predict");
    } catch {
      setError("Demo login failed. You can register a new account below.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card-container">
        <div className="card auth-card">
          <div className="auth-header">
            <div className="auth-logo-badge">🎓</div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">
              Sign in to access your placement history, track improvement trends, and save simulations.
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="identifier">
                Email or Username
              </label>
              <div className="input-with-icon">
                <span className="input-icon">✉️</span>
                <input
                  type="text"
                  id="identifier"
                  className="form-input"
                  placeholder="e.g. demouser or user@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="input-with-icon">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large btn-glow btn-block"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In to Your Account"}
            </button>
          </form>

          <div className="auth-demo-divider">
            <span>OR QUICK ACCESS</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={handleQuickDemo}
            disabled={loading}
          >
            ⚡ 1-Click Demo Login
          </button>

          <div className="auth-footer">
            <span>Don't have an account yet?</span>{" "}
            <Link to="/register" className="auth-link">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
