import { useState, useCallback, useEffect } from "react";
import Flashcard, { type WordData } from "./components/Flashcard";
import TypingPractice from "./components/TypingPractice";
import WordsPage from "./components/WordsPage";
import StatsPage from "./components/StatsPage";
import SettingsPage from "./components/SettingsPage";
import Onboarding from "./components/Onboarding";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import {
  ChevronLeft, ChevronRight, LogOut, RefreshCw,
  Sun, Moon, Eye, EyeOff, Monitor, BookOpen, BarChart3, Settings
} from "lucide-react";

type Page = "review" | "words" | "stats" | "settings";

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════
function toWordData(rw: { wordId: number; word: string; kana: string; romaji: string | null; meaning: string; exampleJa: string | null; exampleZh: string | null; }): WordData {
  return {
    id: rw.wordId, word: rw.word, kana: rw.kana, romaji: rw.romaji ?? "",
    meaning: rw.meaning, example_ja: rw.exampleJa ?? undefined, example_zh: rw.exampleZh ?? undefined,
  };
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = next === "light" ? Sun : next === "dark" ? Moon : Monitor;
  return (
    <button onClick={() => setTheme(next)}
      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors" title={`主题: ${theme}`}>
      <Icon size={18} />
    </button>
  );
}

function AuthForm({ onLogin, onRegister }: { onLogin: (u: string, p: string) => Promise<void>; onRegister: (u: string, p: string) => Promise<void>; }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState(""); const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState(""); const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    if (mode === "register" && password !== confirmPw) { setError("两次密码不一致"); return; }
    if (mode === "register" && password.length < 6) { setError("密码至少 6 位"); return; }
    setError(""); setBusy(true);
    try {
      if (mode === "login") await onLogin(username, password);
      else { await onRegister(username, password); await onLogin(username, password); }
    } catch (err: any) {
      setError(err?.response?.data?.message || (mode === "login" ? "登录失败" : "注册失败"));
    } finally { setBusy(false); }
  };

  const ic = "w-full px-4 py-2.5 rounded-xl border transition-colors outline-none text-base min-h-[44px] bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-0.5">
        {(["login","register"] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-[10px] text-sm font-medium transition-colors ${mode === m ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
            {m === "login" ? "登录" : "注册"}
          </button>
        ))}
      </div>
      <div><label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">用户名</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" className={ic} placeholder="输入用户名" /></div>
      <div className="relative"><label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">密码</label>
        <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode==="login"?"current-password":"new-password"} className={`${ic} pr-12`} placeholder="输入密码" />
        <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
      {mode === "register" && <div><label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">确认密码</label>
        <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" className={ic} placeholder="再次输入密码" /></div>}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <button type="submit" disabled={busy} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors min-h-[44px]">{busy ? "处理中…" : mode === "login" ? "登录" : "注册并登录"}</button>
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        {mode === "login" ? "还没有账号？ " : "已有账号？ "}
        <button type="button" onClick={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); }}
          className="text-indigo-500 hover:text-indigo-400 underline underline-offset-2">{mode === "login" ? "立即注册" : "去登录"}</button>
      </p>
    </form>
  );
}

// ═══════════════════════════════════════════════════════
// Tabs
// ═══════════════════════════════════════════════════════
const TABS: [Page, string, typeof BookOpen][] = [
  ["review", "复习", BookOpen], ["words", "词库", BookOpen], ["stats", "统计", BarChart3], ["settings", "设置", Settings],
];

function TabBar({ page, onChange }: { page: Page; onChange: (p: Page) => void }) {
  return (
    <div className="w-full max-w-md flex rounded-xl bg-gray-100 dark:bg-gray-800 p-0.5">
      {TABS.map(([key, label, Icon]) => (
        <button key={key} onClick={() => onChange(key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[10px] text-sm font-semibold transition-all min-h-[48px] active:scale-95 ${
            page === key 
              ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          }`}>
          <Icon size={16} />{label}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Review Page
// ═══════════════════════════════════════════════════════
function ReviewPage({ words, index, direction, goPrev, goNext, submitReview, refreshWords, wordsLoading }: any) {
  if (words.length === 0) return (
    <div className="flex flex-col items-center gap-4 mt-16 text-gray-400 dark:text-gray-500">
      <p className="text-lg">🎉 今日复习已完成！</p>
      <p className="text-sm">暂时没有需要复习的单词。</p>
      <button onClick={refreshWords} className="mt-2 px-4 py-2 min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">刷新检查</button>
    </div>
  );

  const current = words[index];
  const btn = "flex items-center gap-1 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95";

  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        {words.map((_: any, i: number) => (
          <span key={i} className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-indigo-400 scale-125" : "bg-gray-200 dark:bg-gray-700"}`} />
        ))}
      </div>
      <Flashcard wordData={toWordData(current)} direction={direction} />
      <div className="flex items-center gap-4 sm:gap-6">
        <button onClick={goPrev} disabled={index === 0} className={`${btn} bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700`}><ChevronLeft size={18} />上一个</button>
        <span className="text-sm text-gray-400 tabular-nums min-w-[4ch] text-center">{index + 1} / {words.length}</span>
        <button onClick={goNext} disabled={index === words.length - 1} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}>下一个<ChevronRight size={18} /></button>
      </div>
      <div className="w-full max-w-md space-y-3">
        <TypingPractice
          wordData={toWordData(current)}
          familiarity={current.familiarity}
          onCorrect={() => submitReview(current.wordId, true)}
          onIncorrect={() => submitReview(current.wordId, false)}
        />
        {/* 熟悉度指示器 */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-gray-400">熟练度:</span>
          {[0, 1, 2, 3, 4, 5].map(r => (
            <span key={r} className={`w-2.5 h-2.5 rounded-full transition-all ${
              r <= current.familiarity ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-700"
            }`} />
          ))}
          <span className="text-xs text-gray-400 ml-1">
            {["新词", "眼熟", "认识", "熟悉", "掌握", "精通"][current.familiarity] ?? "新词"}
            {current.streakCorrect > 0 && ` · ${current.streakCorrect}/3`}
          </span>
        </div>
        {/* 手动干预按钮 */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-gray-400 mr-1">手动:</span>
          <button onClick={() => submitReview(current.wordId, true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-colors">✓ 正确</button>
          <button onClick={() => submitReview(current.wordId, false)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors">✗ 错误</button>
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600">点击卡片翻转 · 喇叭听发音 · 连续正确 3 次自动升级</p>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════
export default function App() {
  const { user, isAuthenticated, isLoading, words, wordsLoading, login, register, logout, refreshWords, submitReview } = useAuth();
  const [index, setIndex] = useState(0); const [direction, setDirection] = useState<1 | -1>(1);
  const [page, setPage] = useState<Page>("review");

  useEffect(() => {
    const handler = () => {
      if (words.length > 0 && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CHECK_REVIEW_REMINDER", payload: { pendingCount: words.length } });
      }
    };
    if (words.length > 0) handler();
    window.addEventListener("kiku:check-reminder", handler);
    return () => window.removeEventListener("kiku:check-reminder", handler);
  }, [words]);

  useEffect(() => { setIndex(0); }, [words]);

  const goNext = useCallback(() => { if (index < words.length - 1) { setDirection(1); setIndex(i => i + 1); } }, [index, words.length]);
  const goPrev = useCallback(() => { if (index > 0) { setDirection(-1); setIndex(i => i - 1); } }, [index]);

  if (isLoading) return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4"><div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /><p className="text-gray-400 text-sm">加载中…</p></div>
    </main>
  );

  if (!isAuthenticated) return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 bg-white dark:bg-gray-950">
      <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">聞く Kiku</h1>
      <p className="text-gray-400 dark:text-gray-500 text-sm">登录后开始日语单词复习</p>
      <AuthForm onLogin={login} onRegister={register} />
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
    </main>
  );

  return (
    <main className="min-h-screen flex flex-col items-center gap-4 px-4 py-4 sm:py-6 bg-white dark:bg-gray-950">
      {/* Top bar */}
      <div className="w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">聞く Kiku</h1>
          <span className="text-xs text-gray-400 hidden sm:inline">Hi, {user?.username}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <button onClick={refreshWords} disabled={wordsLoading} className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><RefreshCw size={16} className={wordsLoading ? "animate-spin" : ""} /></button>
          <button onClick={logout} className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><LogOut size={16} /></button>
        </div>
      </div>

      <TabBar page={page} onChange={setPage} />

      {page === "review" && !localStorage.getItem("kiku-onboarding") && <Onboarding />}

      {page === "review" && <ReviewPage words={words} index={index} direction={direction} goPrev={goPrev} goNext={goNext} submitReview={submitReview} refreshWords={refreshWords} wordsLoading={wordsLoading} />}
      {page === "words" && <WordsPage />}
      {page === "stats" && <StatsPage />}
      {page === "settings" && <SettingsPage />}
    </main>
  );
}
