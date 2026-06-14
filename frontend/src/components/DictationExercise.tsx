import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Volume2, Eye, EyeOff } from "lucide-react";
import { playJapaneseSpeech } from "../utils/tts";

interface NewWord { wordId: number; word: string; kana: string; romaji: string | null; meaning: string; }

export default function DictationExercise({ word, onResult }: { word: NewWord; onResult: (wordId: number, isCorrect: boolean) => void }) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [showAnswer, setShowAnswer] = useState(false);
  const [reveal, setReveal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInput(""); setFeedback("idle"); setShowAnswer(false); setReveal(false); inputRef.current?.focus(); }, [word.wordId]);

  // 自动播放
  useEffect(() => { playJapaneseSpeech(word.word); }, [word.wordId]);

  const check = useCallback(() => {
    const t = input.trim();
    if (!t) return;
    const match = t === word.kana || t.toLowerCase() === (word.romaji || "").toLowerCase();
    if (match) { setFeedback("correct"); setTimeout(() => onResult(word.wordId, true), 600); }
    else { setFeedback("wrong"); setShowAnswer(true); setTimeout(() => onResult(word.wordId, false), 2000); }
  }, [input, word, onResult]);

  return (
    <div className="w-full max-w-md space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Volume2 size={14} /> 听写模式
          <button onClick={() => playJapaneseSpeech(word.word)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">🔊 重播</button>
        </span>
        <button onClick={() => setReveal(r => !r)}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
          {reveal ? <EyeOff size={14} /> : <Eye size={14} />} {reveal ? "隐藏" : "显示提示"}
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-center border border-gray-200 dark:border-gray-700">
        {reveal ? (
          <>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{word.word}</p>
            <p className="text-sm text-gray-400">{word.kana}</p>
          </>
        ) : (
          <p className="text-lg text-gray-500 dark:text-gray-400">"{word.meaning}"</p>
        )}
      </div>

      <motion.div animate={feedback === "wrong" ? { x: [0, -10, 10, -10, 10, 0] } : feedback === "correct" ? { scale: [1, 1.04, 1] } : {}}
        className={`rounded-xl border-2 ${feedback === "correct" ? "border-emerald-400" : feedback === "wrong" ? "border-red-400" : "border-gray-200 dark:border-gray-600"} bg-gray-50 dark:bg-gray-900`}>
        <input ref={inputRef} value={input} onChange={e => { setInput(e.target.value); if (feedback !== "idle") setFeedback("idle"); }}
          onKeyDown={e => e.key === "Enter" && check()} placeholder="听到的假名/罗马音…"
          className="w-full bg-transparent px-4 py-3 text-lg text-gray-900 dark:text-gray-100 outline-none font-mono" />
      </motion.div>

      {showAnswer && <p className="text-center text-sm text-gray-500">答案：{word.word}（{word.kana}）</p>}
    </div>
  );
}
