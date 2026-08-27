import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { clearAllPredictions, getPredictions } from "../services/api";

function Settings() {
  const { user, updateUser, changePassword, logout, isAuthenticated } = useAuth();
  const { theme, setTheme, availableThemes } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'theme' | 'security' | 'data'

  // Profile Form State
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    target_role: "Software Engineer",
  });
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [pwdData, setPwdData] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  // Data Action State
  const [dataMessage, setDataMessage] = useState("");
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        email: user.email || "",
        target_role: user.target_role || "Software Engineer",
      });
    }
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="page settings-page">
        <div className="card guest-warning-card">
          <span className="guest-icon">🔒</span>
          <h2>Account Settings Required</h2>
          <p>Please sign in to manage your account, customized theme preferences, and security settings.</p>
          <div className="guest-buttons">
            <button className="btn btn-primary" onClick={() => navigate("/login")}>
              Sign In
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/register")}>
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      await updateUser({
        full_name: profileData.full_name,
        email: profileData.email,
        target_role: profileData.target_role,
        theme_preference: theme,
      });
      setProfileSuccess("Profile settings updated successfully!");
    } catch (err) {
      setProfileError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleThemeChange = async (selectedThemeId) => {
    setTheme(selectedThemeId);
    try {
      await updateUser({ theme_preference: selectedThemeId });
    } catch (err) {
      console.warn("Theme synced locally:", err);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdSuccess("");
    setPwdError("");

    if (!pwdData.current_password || !pwdData.new_password) {
      setPwdError("All password fields are required.");
      return;
    }

    if (pwdData.new_password.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }

    if (pwdData.new_password !== pwdData.confirm_new_password) {
      setPwdError("New passwords do not match.");
      return;
    }

    setPwdLoading(true);
    try {
      await changePassword({
        current_password: pwdData.current_password,
        new_password: pwdData.new_password,
      });
      setPwdSuccess("Password changed successfully!");
      setPwdData({ current_password: "", new_password: "", confirm_new_password: "" });
    } catch (err) {
      setPwdError(err.response?.data?.error || "Failed to change password.");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleExportData = async (format) => {
    try {
      const data = await getPredictions(200);
      const predictions = data.predictions || [];

      if (predictions.length === 0) {
        setDataMessage("No predictions found to export.");
        return;
      }

      if (format === "json") {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(predictions, null, 2)
        )}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `placement_history_${user.username}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setDataMessage("JSON history exported successfully!");
      } else if (format === "csv") {
        const headers = "id,student_name,cgpa,internships,skills,communication,backlogs,prediction,probability,confidence,created_at\n";
        const rows = predictions
          .map(
            (p) =>
              `${p.id},"${p.student_name}",${p.cgpa},${p.internships},${p.skills},${p.communication},${p.backlogs},"${p.prediction}",${p.probability},"${p.confidence}","${p.created_at}"`
          )
          .join("\n");
        const csvString = `data:text/csv;charset=utf-8,${encodeURIComponent(headers + rows)}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", csvString);
        downloadAnchor.setAttribute("download", `placement_history_${user.username}.csv`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setDataMessage("CSV history exported successfully!");
      }
    } catch (err) {
      setDataMessage("Export failed. Please try again.");
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to permanently clear all your prediction records? This cannot be undone.")) {
      return;
    }

    setDataLoading(true);
    try {
      await clearAllPredictions();
      setDataMessage("All prediction history successfully cleared.");
    } catch (err) {
      setDataMessage("Failed to clear history.");
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Do you want to log out of PlacementAI?")) {
      logout();
      navigate("/");
    }
  };

  return (
    <div className="page settings-page">
      <div className="settings-header">
        <div>
          <h1 className="page-title">Account & System Settings</h1>
          <p className="page-subtitle">
            Manage your personal profile, customize interface theme, and configure security preferences.
          </p>
        </div>
        <button type="button" className="btn btn-danger-outline" onClick={handleLogout}>
          🚪 Log Out
        </button>
      </div>

      <div className="settings-layout">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar">
          <button
            className={`settings-nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile & Career
          </button>
          <button
            className={`settings-nav-item ${activeTab === "theme" ? "active" : ""}`}
            onClick={() => setActiveTab("theme")}
          >
            🎨 Theme & Appearance
          </button>
          <button
            className={`settings-nav-item ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            🔒 Password & Security
          </button>
          <button
            className={`settings-nav-item ${activeTab === "data" ? "active" : ""}`}
            onClick={() => setActiveTab("data")}
          >
            💾 Data & Privacy
          </button>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {/* Tab 1: Profile */}
          {activeTab === "profile" && (
            <div className="card settings-panel">
              <h2 className="panel-title">Personal Profile & Career Targets</h2>
              <p className="panel-desc">
                Update your details. These will be prefilled automatically during your placement predictions.
              </p>

              {profileSuccess && <div className="alert alert-success">{profileSuccess}</div>}
              {profileError && <div className="alert alert-danger">{profileError}</div>}

              <form onSubmit={handleProfileSubmit} className="settings-form">
                <div className="form-group">
                  <label className="form-label">Username (Read-only)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={user?.username || ""}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.full_name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, full_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Career Role</label>
                  <select
                    className="form-input"
                    value={profileData.target_role}
                    onChange={(e) =>
                      setProfileData({ ...profileData, target_role: e.target.value })
                    }
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

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={profileLoading}
                >
                  {profileLoading ? "Saving Changes..." : "Save Profile Changes"}
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Theme */}
          {activeTab === "theme" && (
            <div className="card settings-panel">
              <h2 className="panel-title">Appearance & Color Themes</h2>
              <p className="panel-desc">
                Choose your preferred UI theme. Your choice is instantly applied across all pages and saved to your account.
              </p>

              <div className="themes-grid">
                {availableThemes.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`theme-card ${isSelected ? "theme-card-active" : ""}`}
                      onClick={() => handleThemeChange(t.id)}
                    >
                      <div
                        className="theme-preview-box"
                        style={{ backgroundColor: t.bg, borderTop: `4px solid ${t.primary}` }}
                      >
                        <span className="theme-preview-icon">{t.icon}</span>
                        <div className="theme-color-dots">
                          <span style={{ backgroundColor: t.primary }}></span>
                          <span style={{ backgroundColor: "#22c55e" }}></span>
                        </div>
                      </div>
                      <div className="theme-card-info">
                        <div className="theme-name-row">
                          <strong className="theme-name">{t.name}</strong>
                          {isSelected && <span className="badge-active">Active</span>}
                        </div>
                        <p className="theme-desc">{t.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Security */}
          {activeTab === "security" && (
            <div className="card settings-panel">
              <h2 className="panel-title">Password & Account Security</h2>
              <p className="panel-desc">
                Ensure your account is protected with a secure password of at least 6 characters.
              </p>

              {pwdSuccess && <div className="alert alert-success">{pwdSuccess}</div>}
              {pwdError && <div className="alert alert-danger">{pwdError}</div>}

              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={pwdData.current_password}
                    onChange={(e) =>
                      setPwdData({ ...pwdData, current_password: e.target.value })
                    }
                    placeholder="Enter existing password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={pwdData.new_password}
                    onChange={(e) =>
                      setPwdData({ ...pwdData, new_password: e.target.value })
                    }
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={pwdData.confirm_new_password}
                    onChange={(e) =>
                      setPwdData({ ...pwdData, confirm_new_password: e.target.value })
                    }
                    placeholder="Repeat new password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={pwdLoading}
                >
                  {pwdLoading ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {/* Tab 4: Data & Privacy */}
          {activeTab === "data" && (
            <div className="card settings-panel">
              <h2 className="panel-title">Data Management & Privacy</h2>
              <p className="panel-desc">
                Export your prediction audits or wipe stored records from the SQLite database.
              </p>

              {dataMessage && <div className="alert alert-info">{dataMessage}</div>}

              <div className="data-actions-list">
                <div className="data-action-item">
                  <div>
                    <h4>Export Predictions to CSV</h4>
                    <p>Download a spreadsheet file compatible with Excel and Google Sheets.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleExportData("csv")}
                  >
                    📄 Export CSV
                  </button>
                </div>

                <div className="data-action-item">
                  <div>
                    <h4>Export Raw Data as JSON</h4>
                    <p>Download structured JSON data with full explainable feature weights.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleExportData("json")}
                  >
                    📦 Export JSON
                  </button>
                </div>

                <div className="data-action-item danger-zone">
                  <div>
                    <h4 className="text-danger">Clear All Prediction Records</h4>
                    <p>Permanently remove all prediction attempts and historical stats.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleClearHistory}
                    disabled={dataLoading}
                  >
                    🗑️ Wipe History
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
