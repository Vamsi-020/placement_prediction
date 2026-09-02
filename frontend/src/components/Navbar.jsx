import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleTheme, currentThemeMeta } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate("/");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon">🎓</span>
          <span className="logo-text">PlacementAI</span>
          <span className="logo-badge">Pro</span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Main Nav Links */}
        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/" className={navLinkClass} onClick={() => setMenuOpen(false)} end>
            Home
          </NavLink>
          <NavLink to="/predict" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Predict
          </NavLink>
          <NavLink to="/history" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            History
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/analytics" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Analytics
          </NavLink>
        </div>

        {/* Right Section: Theme Toggle & User Auth Menu */}
        <div className="navbar-actions">
          {/* Quick Theme Switcher Button */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Current Theme: ${currentThemeMeta.name} (Click to toggle)`}
            aria-label="Switch Theme"
          >
            <span className="theme-icon">{currentThemeMeta.icon}</span>
            <span className="theme-name-hide-mobile">{currentThemeMeta.name}</span>
          </button>

          {/* User Section */}
          {isAuthenticated ? (
            <div className="user-menu-container" ref={dropdownRef}>
              <button
                className="user-profile-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
              >
                <div className="user-avatar-badge">
                  {getInitials(user?.full_name || user?.username)}
                </div>
                <div className="user-info-pill">
                  <span className="user-display-name">{user?.full_name || user?.username}</span>
                  <span className="user-role-chip">{user?.target_role || "Student"}</span>
                </div>
                <span className="dropdown-chevron">▼</span>
              </button>

              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-user-name">{user?.full_name || user?.username}</div>
                    <div className="dropdown-user-email">{user?.email}</div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link
                    to="/settings"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    ⚙️ Account Settings & Themes
                  </Link>
                  <Link
                    to="/history"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    📜 Past Predictions History
                  </Link>
                  <Link
                    to="/dashboard"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    📊 My Placement Dashboard
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button
                    type="button"
                    className="dropdown-item dropdown-item-danger"
                    onClick={handleLogout}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons-group">
              <Link to="/login" className="btn btn-sm btn-ghost">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
