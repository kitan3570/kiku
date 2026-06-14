import { useState, useCallback, useEffect } from "react";
import Flashcard, { type WordData } from "./components/Flashcard";
import TypingPractice from "./components/TypingPractice";
import { useAuth } from "./context/AuthContext";
import { ChevronLeft, ChevronRight, LogOut, RefreshCw } from "lucide-react";

// ═══════════════════════════════════════════════════════
// 将 API 返回的 ReviewWord 映射为 Flashcard 的 WordData
// ═══════════════════════════════════════════════════════
function toWordData(rw: {
  wordId: number;
  word: string;
  kana: string;
  romaji: string | null;
  meaning: string;
  exampleJa: string | null;
  exampleZh: string | null;
}): WordData {
  return {
    id: rw.wordId,
    word: rw.word,
    kana: rw.kana,
    romaji: rw.romaji ?? "",
    meaning: rw.meaning,
    example_ja: rw.exampleJa ?? undefined,
    example_zh: rw.exampleZh ?? undefined,
  };
}

// ═══════════════════════════════════════════════════════
// 内联登录表单
// ═══════════════════════════════════════════════════════
function LoginForm({ onLogin }: { onLogin: (u: string, p: string) => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError("");
    setBusy(true);
    try {
      await onLogin(username, password);
    } catch {
      setError("登录失败，请检查用户名和密码");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">用户名</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700
                     text-gray-100 placeholder-gray-500 outline-none
                     focus:border-indigo-400 transition-colors"
          placeholder="输入用户名"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">密码</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700
                     text-gray-100 placeholder-gray-500 outline-none
                     focus:border-indigo-400 transition-colors"
          placeholder="输入密码"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-medium
                   hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        {busy ? "登录中…" : "登录"}
      </button>
    </form>
  );
}

// ═══════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════
export default function App() {
  const {
    user,
    isAuthenticated,
    isLoading,
    words,
    wordsLoading,
    login,
    logout,
    refreshWords,
    submitReview,
  } = useAuth();

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // ── Service Worker 复习提醒 ──────────────────────
  useEffect(() => {
    const handler = () => {
      if (words.length > 0 && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "CHECK_REVIEW_REMINDER",
          payload: { pendingCount: words.length },
        });
      }
    };

    // 单词数据变化时触发检查
    if (words.length > 0) handler();

    window.addEventListener("kiku:check-reminder", handler);
    return () => window.removeEventListener("kiku:check-reminder", handler);
  }, [words]);

  // 重置页码当单词列表变化
  useEffect(() => {
    setIndex(0);
  }, [words]);

  const goNext = useCallback(() => {
    if (index >= words.length - 1) return;
    setDirection(1);
    setIndex((i) => i + 1);
  }, [index, words.length]);

  const goPrev = useCallback(() => {
    if (index <= 0) return;
    setDirection(-1);
    setIndex((i) => i - 1);
  }, [index]);

  // ── 加载中 ──────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">正在加载…</p>
        </div>
      </main>
    );
  }

  // ── 未登录 → 登录页 ─────────────────────────────
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 bg-gray-950">
        <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
          聞く Kiku
        </h1>
        <p className="text-gray-500 text-sm">登录后开始日语单词复习</p>
        <LoginForm onLogin={login} />
      </main>
    );
  }

  // ── 已登录 → 复习页 ─────────────────────────────
  const current = words[index];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8 bg-gray-950">
      {/* 顶部栏 */}
      <div className="w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
            聞く Kiku
          </h1>
          <span className="text-xs text-gray-600">Hi, {user?.username}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={refreshWords}
            disabled={wordsLoading}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            title="刷新复习列表"
          >
            <RefreshCw size={16} className={wordsLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
            title="登出"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* 空状态 */}
      {words.length === 0 ? (
        <div className="flex flex-col items-center gap-4 mt-20 text-gray-500">
          <p className="text-lg">🎉 今日复习已完成！</p>
          <p className="text-sm">暂时没有需要复习的单词，休息一下吧。</p>
          <button
            onClick={refreshWords}
            className="mt-2 px-4 py-2 rounded-xl bg-gray-800 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            刷新检查
          </button>
        </div>
      ) : (
        <>
          {/* 进度指示器 */}
          <div className="flex items-center gap-2 text-sm">
            {words.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  i === index ? "bg-indigo-400 scale-125" : "bg-gray-700"
                }`}
              />
            ))}
          </div>

          {/* 闪卡 */}
          <Flashcard wordData={toWordData(current)} direction={direction} />

          {/* 导航按钮 */}
          <div className="flex items-center gap-6">
            <button
              onClick={goPrev}
              disabled={index === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium
                         bg-gray-800 text-gray-200 hover:bg-gray-700
                         disabled:opacity-30 disabled:cursor-not-allowed
                         transition-all duration-200 active:scale-95"
            >
              <ChevronLeft size={18} />
              上一个
            </button>

            <span className="text-sm text-gray-500 tabular-nums min-w-[4ch] text-center">
              {index + 1} / {words.length}
            </span>

            <button
              onClick={goNext}
              disabled={index === words.length - 1}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium
                         bg-indigo-600 text-white hover:bg-indigo-500
                         disabled:opacity-30 disabled:cursor-not-allowed
                         transition-all duration-200 active:scale-95"
            >
              下一个
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 拼写练习 + 提交评分 */}
          <div className="w-full max-w-md space-y-3">
            <TypingPractice
              wordData={toWordData(current)}
              onCorrect={() => submitReview(current.wordId, 5)}
            />

            {/* 手动评分按钮 */}
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-xs text-gray-600 mr-1">快速评分:</span>
              {[0, 1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => submitReview(current.wordId, r)}
                  className="w-8 h-8 rounded-full text-xs font-medium
                             bg-gray-800 text-gray-400 hover:bg-indigo-600 hover:text-white
                             transition-all duration-150 active:scale-90"
                  title={
                    r === 0 ? "完全不会" :
                    r === 1 ? "眼熟" :
                    r === 2 ? "认识" :
                    r === 3 ? "熟悉" :
                    r === 4 ? "掌握" : "精通"
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 操作提示 */}
          <p className="text-xs text-gray-600">
            点击卡片翻转查看释义 · 点击喇叭图标听发音 · 评分后自动刷新
          </p>
        </>
      )}
    </main>
  );
}
