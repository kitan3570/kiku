import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

// ═══════════════════════════════════════════════════════
// Axios 实例
// ═══════════════════════════════════════════════════════
const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ═══════════════════════════════════════════════════════
// 请求拦截器 — 自动附加 Access Token
// ═══════════════════════════════════════════════════════
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ═══════════════════════════════════════════════════════
// Token 刷新队列 — 防止并发请求同时触发多次刷新
// ═══════════════════════════════════════════════════════
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

// ═══════════════════════════════════════════════════════
// 响应拦截器 — 401 自动刷新 Token
// ═══════════════════════════════════════════════════════
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 非 401 错误直接抛出
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // 跳过刷新接口本身（防止死循环）
    if (originalRequest.url === "/auth/refresh") {
      forceLogout();
      return Promise.reject(error);
    }

    // ── 如果已经在刷新中，将请求加入队列 ──────────
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // 调用刷新接口（refresh_token 由 HttpOnly Cookie 自动携带）
      const { data } = await axios.post("/api/auth/refresh", {}, { withCredentials: true });

      const newToken: string = data.accessToken;
      localStorage.setItem("access_token", newToken);

      // 重试队列中的请求
      processQueue(null, newToken);

      // 重试当前请求
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ═══════════════════════════════════════════════════════
// 强制登出
// ═══════════════════════════════════════════════════════
function forceLogout() {
  localStorage.removeItem("access_token");
  // 跳转到登录页（避免在同一页面上反复刷新）
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export default api;
