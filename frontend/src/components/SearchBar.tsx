import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";

interface SearchResult {
  id: number; word: string; kana: string; romaji: string | null;
  meaning: string; tags: string | null; createdAt: string;
  reviewTotal: number; reviewCorrect: number;
}

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(data.results || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setOpen(true); inputRef.current?.focus(); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 
                   bg-gray-50 dark:bg-gray-800 text-sm text-gray-400 hover:border-indigo-300 transition-colors">
        <Search size={14} /> 搜索单词…
        <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-400">Ctrl K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <Search size={18} className="text-gray-400" />
                <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="搜索日文/假名/罗马音/中文…" autoFocus
                  className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 outline-none text-base" />
                <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading && <p className="text-sm text-gray-400 p-4 text-center">搜索中…</p>}
                {!loading && results.length === 0 && query && <p className="text-sm text-gray-400 p-4 text-center">无结果</p>}
                {results.map(r => (
                  <div key={r.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100">{r.word}</span>
                      <span className="text-sm text-gray-400">{r.kana}</span>
                      {r.romaji && <span className="text-xs text-gray-500 italic">{r.romaji}</span>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{r.meaning}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                      {r.tags && <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">{r.tags}</span>}
                      {r.reviewTotal > 0 && <span>复习 {r.reviewTotal} 次 · 正确率 {Math.round(r.reviewCorrect / r.reviewTotal * 100)}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
