import React, { createContext, useContext, useState, useEffect } from "react";
import {
  loginUser,
  registerUser,
  getCurrentUser,
  updateProfile,
  changePassword as apiChangePassword,
} from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("placement_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem("placement_token") || null;
  });
  const [loading, setLoading] = useState(true);

  // Validate and sync user state with backend on startup
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("placement_token");
      if (savedToken) {
        try {
          const data = await getCurrentUser();
          setUser(data.user);
          localStorage.setItem("placement_user", JSON.stringify(data.user));
        } catch (error) {
          console.warn("Session expired or invalid token:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    const data = await loginUser({ identifier, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("placement_token", data.token);
    localStorage.setItem("placement_user", JSON.stringify(data.user));
    if (data.user.theme_preference) {
      localStorage.setItem("placement_theme", data.user.theme_preference);
      document.documentElement.setAttribute("data-theme", data.user.theme_preference);
    }
    return data;
  };

  const register = async (userData) => {
    const data = await registerUser(userData);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("placement_token", data.token);
    localStorage.setItem("placement_user", JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("placement_token");
    localStorage.removeItem("placement_user");
  };

  const updateUser = async (profileData) => {
    const data = await updateProfile(profileData);
    setUser(data.user);
    localStorage.setItem("placement_user", JSON.stringify(data.user));
    return data;
  };

  const changePassword = async (passwordData) => {
    return await apiChangePassword(passwordData);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await getCurrentUser();
      setUser(data.user);
      localStorage.setItem("placement_user", JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        register,
        logout,
        updateUser,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
