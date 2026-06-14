import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import type { WordData } from "./Flashcard";

interface TypingPracticeProps {
  wordData: WordData;
  /** 每次答对时回调（用于统计、切换等） */
  onCorrect?: () => void;
}

type FeedbackState = "idle" | "success" | "failure";

export default function TypingPractice({ wordData, onCorrect }: TypingPracticeProps) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  // 切换单词时重置状态
  useEffect(() => {
    setInput("");
    setFeedback("idle");
    inputRef.current?.focus();
  }, [wordData.id]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // 与假名和罗马音比对（忽略大小写）
    const isCorrect =
      trimmed === wordData.kana ||
      trimmed.toLowerCase() === wordData.romaji.toLowerCase();

    if (isCorrect) {
      setFeedback("success");
      onCorrect?.();

      // success 动画持续后自动清空并恢复 idle
      setTimeout(() => {
        setInput("");
        setFeedback("idle");
        inputRef.current?.focus();
      }, 800);
    } else {
      setFeedback("failure");

      // failure 动画持续后恢复 idle
      setTimeout(() => {
        setInput("");
        setFeedback("idle");
        inputRef.current?.focus();
      }, 600);
    }
  }, [input, wordData.kana, wordData.romaji, onCorrect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── 边框颜色 ────────────────────────────────────────
  const borderColor =
    feedback === "success"
      ? "border-emerald-400"
      : feedback === "failure"
        ? "border-red-400"
        : "border-gray-600 focus-within:border-indigo-400";

  return (
    <div className="w-full max-w-md">
      {/* 提示词 */}
      <p className="text-sm text-gray-400 mb-2 text-center">
        请输入「{wordData.meaning}」的假名或罗马音
      </p>

      {/* 输入框容器 */}
      <motion.div
        animate={
          feedback === "failure"
            ? { x: [0, -10, 10, -10, 10, 0] }
            : feedback === "success"
              ? { scale: [1, 1.04, 1] }
              : {}
        }
        transition={
          feedback === "failure"
            ? { duration: 0.4, ease: "easeInOut" }
            : { duration: 0.3, ease: "easeOut" }
        }
        className={`relative rounded-xl border-2 ${borderColor} bg-gray-900 transition-colors duration-300`}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (feedback !== "idle") setFeedback("idle");
          }}
          onKeyDown={handleKeyDown}
          placeholder="输入假名或罗马音，按 Enter 确认"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-transparent px-4 py-3 text-lg text-gray-100 placeholder-gray-600
                     outline-none font-mono tracking-wide"
        />
      </motion.div>

      {/* 反馈文字 */}
      <p
        className={`text-xs text-center mt-2 transition-opacity duration-200 ${
          feedback === "idle" ? "opacity-0" : "opacity-100"
        } ${
          feedback === "success"
            ? "text-emerald-400"
            : "text-red-400"
        }`}
      >
        {feedback === "success" ? "✓ 正确！" : feedback === "failure" ? "✗ 再试一次" : ""}
      </p>
    </div>
  );
}
