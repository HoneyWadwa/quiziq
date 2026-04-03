// ─── api/client.js — Axios Instance + Interceptors ───────────────────────────
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("quiziq_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalize errors ────────────────────────────────────
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      "Something went wrong";

    // Auto logout on 401
    if (error.response?.status === 401) {
      localStorage.removeItem("quiziq_token");
      localStorage.removeItem("quiziq_user");
      window.location.href = "/login";
    }

    return Promise.reject(new Error(message));
  }
);

export default client;
