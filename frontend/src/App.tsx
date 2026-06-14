import { useState, useCallback } from "react";
import Flashcard, { type WordData } from "./components/Flashcard";
import TypingPractice from "./components/TypingPractice";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Mock 单词数据 ─────────────────────────────────────
const MOCK_WORDS: WordData[] = [
  {
    id: 1,
    word: "食べる",
    kana: "たべる",
    romaji: "taberu",
    meaning: "吃",
    example_ja: "毎朝パンを食べます。",
    example_zh: "每天早上吃面包。",
  },
  {
    id: 2,
    word: "勉強",
    kana: "べんきょう",
    romaji: "benkyou",
    meaning: "学习",
    example_ja: "日本語を勉強しています。",
    example_zh: "正在学习日语。",
  },
  {
    id: 3,
    word: "綺麗",
    kana: "きれい",
    romaji: "kirei",
    meaning: "漂亮、干净",
    example_ja: "今日は綺麗な空ですね。",
    example_zh: "今天的天空真漂亮呢。",
  },
];

// ── App ───────────────────────────────────────────────
export default function App() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const goNext = useCallback(() => {
    if (index >= MOCK_WORDS.length - 1) return;
    setDirection(1);
    setIndex((i) => i + 1);
  }, [index]);

  const goPrev = useCallback(() => {
    if (index <= 0) return;
    setDirection(-1);
    setIndex((i) => i - 1);
  }, [index]);

  const current = MOCK_WORDS[index];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 py-12">
      {/* 标题 */}
      <h1 className="text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
        聞く Kiku
      </h1>

      {/* 进度指示器 */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {MOCK_WORDS.map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i === index ? "bg-indigo-400 scale-125" : "bg-gray-700"
            }`}
          />
        ))}
      </div>

      {/* 闪卡 */}
      <Flashcard wordData={current} direction={direction} />

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
          {index + 1} / {MOCK_WORDS.length}
        </span>

        <button
          onClick={goNext}
          disabled={index === MOCK_WORDS.length - 1}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium
                     bg-indigo-600 text-white hover:bg-indigo-500
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all duration-200 active:scale-95"
        >
          下一个
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 拼写练习 */}
      <TypingPractice wordData={current} />

      {/* 操作提示 */}
      <p className="text-xs text-gray-600">
        点击卡片翻转查看释义 · 点击喇叭图标听发音
      </p>
    </main>
  );
}
