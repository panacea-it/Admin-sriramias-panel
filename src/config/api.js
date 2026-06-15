import axios from "axios";
import { clearAuthStorage, getAuthToken } from "../utils/authStorage";

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
export const BASE_URL = "https://sriramias-backend.onrender.com";

export const API_ENDPOINTS = {
  LOGIN_SUPER_ADMIN: "/api/auth/login-super-admin",
};

function resolveAxiosBaseURL() {
  if (import.meta.env.DEV) {
    return "";
  }
  return BASE_URL;
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
      !String(token).startsWith("demo-token-")
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
  if (import.meta.env.DEV) {
    return endpoint;
  }
  return `${BASE_URL}${endpoint}`;
}

export default api;
