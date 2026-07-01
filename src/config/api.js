import axios from "axios";
import { clearAuthStorage, getAuthToken, isOfflineAuthToken } from "../utils/authStorage";

function readEnvBaseUrl() {
  const raw =
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim() ||
    import.meta.env.VITE_BASE_URL?.trim() ||
    import.meta.env.REACT_APP_BASE_URL?.trim() ||
    "";
  if (!raw) return "";
  return raw.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

/** API host without trailing slash or `/api` suffix */
const FALLBACK_BASE = "https://sriramias-backend.onrender.com";

export const BASE_URL = readEnvBaseUrl() || FALLBACK_BASE;

export const API_ENDPOINTS = {
  LOGIN_SUPER_ADMIN: "/api/auth/login-super-admin",
};

function normalizeApiHost(raw = "") {
  return String(raw || "")
    .trim()
    .replace(/\/api\/?$/i, "")
    .replace(/\/$/, "");
}

/** Resolved API host from env (no `/api` suffix). Empty when frontend-only. */
export function resolveApiHost() {
  if (import.meta.env.VITE_FRONTEND_ONLY === "true") {
    return "";
  }
  return normalizeApiHost(readEnvBaseUrl() || FALLBACK_BASE);
}

function shouldUseDevProxy() {
  return import.meta.env.DEV && import.meta.env.VITE_FRONTEND_ONLY !== "true";
}

/**
 * Axios base URL when request paths omit `/api` (e.g. `/finance/emi-management/...`).
 * Dev: `/api` via Vite proxy → VITE_API_BASE_URL (avoids CORS).
 * Prod: `https://<host>/api` from env.
 */
export function resolveApiBaseUrlWithSuffix() {
  if (import.meta.env.VITE_FRONTEND_ONLY === "true") {
    return "/api";
  }
  if (shouldUseDevProxy()) {
    return "/api";
  }
  const host = resolveApiHost();
  if (!host) {
    return "/api";
  }
  return `${host}/api`;
}

/**
 * Axios base URL when request paths include `/api/...` (e.g. `/api/categories`).
 * Dev: empty base + `/api/...` path → Vite proxy.
 */
export function resolveApiHostBaseUrl() {
  if (import.meta.env.VITE_FRONTEND_ONLY === "true") {
    return "";
  }
  if (shouldUseDevProxy()) {
    return "";
  }
  return resolveApiHost();
}

function resolveAxiosBaseURL() {
  return resolveApiHostBaseUrl();
}

const api = axios.create({
  baseURL: resolveAxiosBaseURL(),
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken() || localStorage.getItem("SuperAdminToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || "");
    const token = getAuthToken();

    if (
      status === 401 &&
      !url.includes("/auth/login") &&
      !isOfflineAuthToken(token)
    ) {
      clearAuthStorage();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export function buildApiUrl(path) {
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  if (shouldUseDevProxy()) {
    return endpoint;
  }
  const host = resolveApiHost();
  if (!host) {
    return endpoint;
  }
  return `${host}${endpoint}`;
}

export default api;
