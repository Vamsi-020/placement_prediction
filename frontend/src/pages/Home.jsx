import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="page home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span>✨ AI-Powered Career Intelligence</span>
          </div>
          <h1 className="hero-heading">
            Predict, Track & Optimize Your <span className="gradient-text">Campus Placement</span>
          </h1>
          <p className="hero-paragraph">
            Harness machine learning models trained on real campus placement records. Evaluate your readiness, simulate skill improvements, track your progress in SQLite, and secure your dream offer.
          </p>

          <div className="hero-button-row">
            <Link to="/predict" className="btn btn-primary btn-large btn-glow">
              🚀 Start AI Assessment
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-secondary btn-large">
                📊 Open Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn btn-secondary btn-large">
                🔑 Sign In / Register
              </Link>
            )}
          </div>

          <div className="hero-trust-metrics">
            <div className="trust-item">
              <span className="trust-val">92.86%</span>
              <span className="trust-label">Model Accuracy</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <span className="trust-val">5 Factors</span>
              <span className="trust-label">Holistic ML Evaluation</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <span className="trust-val">Instant</span>
              <span className="trust-label">What-If Career Simulator</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <span className="trust-val">SQLite Vault</span>
              <span className="trust-label">Per-User History & Trends</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Designed for Engineering & Management Students</h2>
          <p className="section-subtitle">
            A comprehensive suite of tools built to guide your placement preparation journey.
          </p>
        </div>

        <div className="features-grid">
          <div className="card feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🧠</span>
            </div>
            <h3>Random Forest ML Classifier</h3>
            <p>
              Trained on multi-dimensional placement data to predict placement odds with over 92% validated accuracy.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">⚡</span>
            </div>
            <h3>Interactive What-If Optimizer</h3>
            <p>
              Test hypothetical improvements in real time: see how adding an internship or boosting CGPA shifts your placement probability.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">📜</span>
            </div>
            <h3>Historical Progress & Deltas</h3>
            <p>
              SQLite database records every attempt, letting returning users measure delta improvements between multiple assessments.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🔍</span>
            </div>
            <h3>Explainable AI Insights</h3>
            <p>
              Breakdown of tree feature weights reveals exactly which skills or academic areas influenced your prediction verdict.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🎨</span>
            </div>
            <h3>Customizable Multi-Theme UI</h3>
            <p>
              Tailor your workspace with 5 themes: Midnight Slate, Crystal Light, Cyber Neon, Forest Emerald, and Sunset Indigo.
            </p>
          </div>

          <div className="card feature-card">
            <div className="feature-icon-wrapper">
              <span className="feature-icon">🖨️</span>
            </div>
            <h3>Exportable Audit Reports</h3>
            <p>
              Print comprehensive candidate placement audit sheets or export your full prediction history as CSV & JSON files.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="steps-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Three simple steps to unlock your personalized placement roadmap.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <h3>Enter Your Metrics</h3>
            <p>Provide your CGPA, internship counts, technical skills rating, communication score, and backlogs.</p>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <h3>Get AI Prediction</h3>
            <p>Our model evaluates your profile, returning an instant probability score, confidence level, and feature impact analysis.</p>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <h3>Optimize & Track</h3>
            <p>Simulate improvements in the What-If optimizer and track your progress over time in your personalized dashboard.</p>
          </div>
        </div>
      </section>

      {/* CTA Footer Card */}
      <section className="cta-section card">
        <div className="cta-content">
          <h2>Ready to discover your placement probability?</h2>
          <p>Run your assessment now or create an account to save your historical records.</p>
          <div className="cta-actions">
            <Link to="/predict" className="btn btn-primary btn-large btn-glow">
              🚀 Run Free Assessment
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-secondary btn-large">
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
