import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Trash2, Download, Plus, Filter, X } from "lucide-react";
import api from "../api/axios";

interface WordItem {
  id: number; word: string; kana: string; romaji: string | null;
  meaning: string; exampleJa: string | null; exampleZh: string | null; tags: string | null;
}

export default function WordsPage() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [presetMsg, setPresetMsg] = useState("");

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (tagFilter) params.tag = tagFilter;
      const { data } = await api.get("/words", { params });
      setWords(data.words);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [tagFilter]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  const handleDelete = async (id: number) => {
    await api.delete(`/words/${id}`);
    setWords(prev => prev.filter(w => w.id !== id));
  };

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importText);
      const arr = Array.isArray(parsed) ? parsed : parsed.words;
      if (!Array.isArray(arr) || arr.length === 0) {
        setImportMsg("请粘贴有效的 JSON 数组"); return;
      }
      const { data } = await api.post("/words/import", { words: arr });
      setImportMsg(`✅ ${data.message}`);
      setImportText("");
      fetchWords();
    } catch { setImportMsg("JSON 格式错误"); }
  };

  const handlePreset = async (level: string) => {
    try {
      const { data } = await api.post(`/words/preset/${level}`);
      setPresetMsg(`✅ ${data.message}`);
      fetchWords();
    } catch { setPresetMsg("导入失败"); }
  };

  const allTags = [...new Set(words.flatMap(w => (w.tags || "").split(",").map(t => t.trim()).filter(Boolean)))];

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <BookOpen size={20} className="text-indigo-500" /> 词库
        </h2>
        <span className="text-xs text-gray-400">{words.length} 个单词</span>
      </div>

      {/* 预制词单 */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => handlePreset("N5")}
          className="px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
          <Download size={14} className="inline mr-1" />导入 N5 词单 (35词)
        </button>
        <button onClick={() => handlePreset("N4")}
          className="px-4 py-2 min-h-[44px] rounded-xl text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
          <Download size={14} className="inline mr-1" />导入 N4 词单 (30词)
        </button>
      </div>
      {presetMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400">{presetMsg}</p>}

      {/* 标签筛选 */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setTagFilter("")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${!tagFilter ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
            全部
          </button>
          {allTags.map(t => (
            <button key={t} onClick={() => setTagFilter(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${tagFilter === t ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* 自定义导入 */}
      <div>
        <button onClick={() => setShowImport(v => !v)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-500 transition-colors">
          {showImport ? <X size={14} /> : <Plus size={14} />}
          {showImport ? "收起" : "自定义导入单词"}
        </button>
        <AnimatePresence>
          {showImport && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-2 space-y-2">
              <textarea value={importText} onChange={e => setImportText(e.target.value)}
                placeholder='[{"word":"食べる","kana":"たべる","romaji":"taberu","meaning":"吃"}]'
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-indigo-400 resize-none" />
              <button onClick={handleImport}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 min-h-[44px] transition-colors">
                导入
              </button>
              {importMsg && <p className="text-xs text-gray-500">{importMsg}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 单词列表 */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 text-sm">加载中…</div>
      ) : words.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">还没有单词，导入 N5/N4 词单开始吧</div>
      ) : (
        <div className="space-y-2">
          {words.map(w => (
            <div key={w.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 dark:text-gray-100">{w.word}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{w.kana}</span>
                  {w.romaji && <span className="text-xs text-gray-400 italic">{w.romaji}</span>}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{w.meaning}</p>
                {w.tags && (
                  <div className="flex gap-1 mt-1">
                    {w.tags.split(",").map(t => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">{t.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => handleDelete(w.id)}
                className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
