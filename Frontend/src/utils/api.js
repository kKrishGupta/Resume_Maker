import axios from "axios";

const getBaseURL = () => {
  const envUrl = (typeof import.meta !== "undefined" && import.meta.env)
    ? (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)
    : null;

  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window && (window.__API_URL__ || window.__API_BASE_URL__)) {
    return (window.__API_URL__ || window.__API_BASE_URL__).replace(/\/+$/, "");
  }

  return "http://localhost:3000";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 8000 // 8 second timeout to prevent any hung network requests
});

// 🔐 attach token automatically
api.interceptors.request.use((config) => {
  if (typeof localStorage !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 🔐 handle 401 cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof localStorage !== "undefined") {
        if (error.response?.data?.message?.includes("blacklisted") || error.response?.data?.message?.includes("Invalid")) {
          localStorage.removeItem("token");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
