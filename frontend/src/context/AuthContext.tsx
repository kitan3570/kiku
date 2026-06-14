import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import axios from "axios";
import api from "../api/axios";

// ═══════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════
export interface User {
  id: number;
  username: string;
}

export interface ReviewWord {
  progressId: number;
  wordId: number;
  word: string;
  kana: string;
  romaji: string | null;
  meaning: string;
  exampleJa: string | null;
  exampleZh: string | null;
  tags: string | null;
  familiarity: number;
  stability: number;
  difficulty: number;
  repetitions: number;
  lapses: number;
  lastReview: string | null;
  nextReview: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  words: ReviewWord[];
  wordsLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshWords: () => Promise<void>;
  submitReview: (wordId: number, rating: number) => Promise<void>;
}

// ═══════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [words, setWords] = useState<ReviewWord[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);

  // ── 应用启动时：检查是否有 Access Token ──────────
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    // 尝试用 token 获取用户信息和今日复习
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      // 用 /api/review/today 验证 token 有效性 + 获取单词数据
      const { data } = await api.get("/review/today");
      setWords(data.words || []);
      // 从 token 中解析用户信息（简化方案，也可调 /api/auth/me）
      const token = localStorage.getItem("access_token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({ id: payload.userId, username: payload.username });
      }
    } catch {
      // token 无效或已过期 — 清除
      localStorage.removeItem("access_token");
    } finally {
      setIsLoading(false);
    }
  }

  const API_BASE = import.meta.env.VITE_API_URL || "/api";

  // ── 登录 ────────────────────────────────────────
  const login = useCallback(async (username: string, password: string) => {
    const { data } = await axios.post(`${API_BASE}/auth/login`, { username, password }, { withCredentials: true });
    localStorage.setItem("access_token", data.accessToken);
    setUser(data.user);
    // 登录后自动拉取今日复习
    await refreshWordsInternal();
  }, []);

  // ── 注册 ────────────────────────────────────────
  const register = useCallback(async (username: string, password: string) => {
    await api.post("/auth/register", { username, password });
  }, []);

  // ── 登出 ────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch {
      // 即使后端登出失败，也清除前端状态
    }
    localStorage.removeItem("access_token");
    setUser(null);
    setWords([]);
  }, []);

  // ── 刷新单词数据 ────────────────────────────────
  const refreshWordsInternal = useCallback(async () => {
    setWordsLoading(true);
    try {
      const { data } = await api.get("/review/today");
      setWords(data.words || []);
    } catch (err) {
      console.error("[refreshWords]", err);
    } finally {
      setWordsLoading(false);
    }
  }, []);

  const refreshWords = useCallback(async () => {
    await refreshWordsInternal();
  }, [refreshWordsInternal]);

  // ── 提交复习评分 ────────────────────────────────
  const submitReview = useCallback(async (wordId: number, rating: number) => {
    await api.post("/review/submit", { wordId, rating });
    // 提交后从列表中移除该词
    setWords((prev) => prev.filter((w) => w.wordId !== wordId));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        words,
        wordsLoading,
        login,
        register,
        logout,
        refreshWords,
        submitReview,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

