// api.js
// Centralized Axios service with JWT Authorization interceptor and full API bindings.

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization Bearer token to all outgoing requests if token exists
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("placement_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiry or unauthorized errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute =
        error.config.url.includes("/api/auth/login") ||
        error.config.url.includes("/api/auth/register");

      if (!isAuthRoute) {
        // Token expired or invalid
        localStorage.removeItem("placement_token");
        localStorage.removeItem("placement_user");
      }
    }
    return Promise.reject(error);
  }
);

// =========================================================
// 1. Authentication APIs
// =========================================================

export const registerUser = async (userData) => {
  const response = await API.post("/api/auth/register", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await API.post("/api/auth/login", credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await API.get("/api/auth/me");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await API.put("/api/auth/profile", profileData);
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await API.post("/api/auth/change-password", passwordData);
  return response.data;
};

// =========================================================
// 2. Prediction & History APIs
// =========================================================

export const predictPlacement = async (data) => {
  const response = await API.post("/api/predict", data);
  return response.data;
};

export const getPredictions = async (limit = 50, offset = 0) => {
  const response = await API.get(`/api/predictions?limit=${limit}&offset=${offset}`);
  return response.data;
};

export const getPredictionStats = async () => {
  const response = await API.get("/api/predictions/stats");
  return response.data;
};

export const deletePrediction = async (id) => {
  const response = await API.delete(`/api/predictions/${id}`);
  return response.data;
};

export const clearAllPredictions = async () => {
  const response = await API.delete("/api/predictions/clear-all");
  return response.data;
};

// =========================================================
// 3. System Status APIs
// =========================================================

export const checkBackend = async () => {
  const response = await API.get("/api/health");
  return response.data;
};

export const getAccuracy = async () => {
  const response = await API.get("/api/accuracy");
  return response.data;
};

export default API;
