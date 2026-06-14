import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import type { WordData } from "./Flashcard";

interface TypingPracticeProps {
  wordData: WordData;
  /** 熟悉度 0-5，控制信息遮蔽程度 */
  familiarity?: number;
  onCorrect?: () => void;
  onIncorrect?: () => void;
}

type FeedbackState = "idle" | "success" | "failure";

/**
 * 根据熟悉度决定显示多少提示信息
 * 0-1(新词): 显示汉字 + 假名 → 输入假名即可
 * 2-3(学习): 显示汉字 → 输入假名
 * 4(熟悉): 显示假名 → 输入汉字
 * 5(精通): 仅显示释义 → 输入假名或汉字
 */
export default function TypingPractice({ wordData, familiarity = 0, onCorrect, onIncorrect }: TypingPracticeProps) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput(""); setFeedback("idle"); inputRef.current?.focus();
  }, [wordData.id]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const matchKana = trimmed === wordData.kana;
    const matchRomaji = trimmed.toLowerCase() === wordData.romaji.toLowerCase();
    const matchWord = trimmed === wordData.word;
    // 高熟悉度也接受汉字输入
    const matchAny = familiarity >= 4 ? (matchKana || matchRomaji || matchWord) : (matchKana || matchRomaji);
    const isCorrect = matchAny;

    if (isCorrect) {
      setFeedback("success"); onCorrect?.();
      setTimeout(() => { setInput(""); setFeedback("idle"); inputRef.current?.focus(); }, 800);
    } else {
      setFeedback("failure"); onIncorrect?.();
      setTimeout(() => { setInput(""); setFeedback("idle"); inputRef.current?.focus(); }, 600);
    }
  }, [input, wordData, familiarity, onCorrect, onIncorrect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
  };

  const borderColor = feedback === "success" ? "border-emerald-400" : feedback === "failure" ? "border-red-400" : "border-gray-300 dark:border-gray-600 focus-within:border-indigo-400";

  // 根据熟悉度显示提示
  const getHint = () => {
    switch (true) {
      case familiarity >= 5: return <><span className="font-bold text-gray-700 dark:text-gray-200">{wordData.meaning}</span>（输入假名或汉字）</>;
      case familiarity >= 4: return <>假名: <span className="font-mono text-indigo-500">{wordData.kana}</span> — 输入对应的汉字</>;
      case familiarity >= 2: return <>汉字: <span className="font-bold text-gray-700 dark:text-gray-200">{wordData.word}</span> — 输入假名</>;
      default: return <><span className="font-bold text-gray-700 dark:text-gray-200">{wordData.word}</span>（<span className="text-gray-500">{wordData.kana}</span>）— 输入假名</>;
    }
  };

  const getPlaceholder = () => {
    if (familiarity >= 5) return "输入假名或汉字…";
    if (familiarity >= 4) return "输入对应的汉字…";
    return "输入假名或罗马音…";
  };

  return (
    <div className="w-full max-w-md">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">
        {getHint()}
      </p>
      <motion.div
        animate={feedback === "failure" ? { x: [0, -10, 10, -10, 10, 0] } : feedback === "success" ? { scale: [1, 1.04, 1] } : {}}
        transition={feedback === "failure" ? { duration: 0.4, ease: "easeInOut" } : { duration: 0.3, ease: "easeOut" }}
        className={`relative rounded-xl border-2 ${borderColor} bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}
      >
        <input ref={inputRef} type="text" value={input}
          onChange={(e) => { setInput(e.target.value); if (feedback !== "idle") setFeedback("idle"); }}
          onKeyDown={handleKeyDown} placeholder={getPlaceholder()}
          autoComplete="off" autoCorrect="off" spellCheck={false}
          className="w-full bg-transparent px-4 py-3 text-base sm:text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 outline-none font-mono tracking-wide" />
      </motion.div>
      <p className={`text-xs text-center mt-2 transition-opacity duration-200 ${feedback === "idle" ? "opacity-0" : "opacity-100"} ${feedback === "success" ? "text-emerald-400" : "text-red-400"}`}>
        {feedback === "success" ? `✓ 正确！「${wordData.word}」` : feedback === "failure" ? `✗ 答案是「${wordData.kana}」` : ""}
      </p>
    </div>
  );
}
