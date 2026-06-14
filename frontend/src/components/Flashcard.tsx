import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Volume2 } from "lucide-react";
import { playJapaneseSpeech } from "../utils/tts";

// ── 类型定义 ──────────────────────────────────────────
export interface WordData {
  id: number;
  word: string;
  kana: string;
  romaji: string;
  meaning: string;
  example_ja?: string;
  example_zh?: string;
}

interface FlashcardProps {
  wordData: WordData;
  /** 滑动方向：1=下一张(向左滑入)，-1=上一张(向右滑入) */
  direction: 1 | -1;
}

// ── 滑动动画变体 ─────────────────────────────────────
const slideVariants: Variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.92,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.92,
    transition: { duration: 0.25, ease: "easeIn" },
  }),
};

// ── 组件 ──────────────────────────────────────────────
export default function Flashcard({ wordData, direction }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => setIsFlipped((prev) => !prev);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发酵片翻转
    playJapaneseSpeech(wordData.word);
  };

  return (
    <div className="flex justify-center items-center w-full">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={wordData.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="w-full max-w-md cursor-pointer select-none"
          style={{ perspective: "1200px" }}
          onClick={handleCardClick}
        >
          {/* ── 3D 翻转容器 ────────────────────────── */}
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full aspect-[3/4]"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* ════════════════════════════════════════
                正面 — 日文
               ════════════════════════════════════════ */}
            <div
              className="absolute inset-0 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center gap-6 p-10"
              style={{ backfaceVisibility: "hidden" }}
            >
              {/* 渐变背景 */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
              {/* 装饰光晕 */}
              <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

              {/* 文字内容 */}
              <span className="relative text-3xl sm:text-5xl font-bold text-white tracking-wider drop-shadow-lg">
                {wordData.word}
              </span>
              <span className="relative text-lg sm:text-xl text-white/80 tracking-widest">
                {wordData.kana}
              </span>

              {/* 喇叭按钮 — 朗读当前单词 */}
              <button
                onClick={handleSpeak}
                className="relative mt-2 p-3 rounded-full bg-white/15 hover:bg-white/25
                           transition-colors duration-200 active:scale-90"
                aria-label="朗读"
              >
                <Volume2 size={22} className="text-white/80" />
              </button>

              {/* 底部提示 */}
              <span className="absolute bottom-6 text-xs text-white/40 tracking-wide">
                点击卡片翻转查看释义
              </span>
            </div>

            {/* ════════════════════════════════════════
                背面 — 中文释义 / 罗马音 / 例句
               ════════════════════════════════════════ */}
            <div
              className="absolute inset-0 rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-center gap-5 p-8
                         bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              {/* 含义 */}
              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  释义
                </span>
                <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                  {wordData.meaning}
                </p>
              </div>

              {/* 罗马音 */}
              {wordData.romaji && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    ローマ字
                  </span>
                  <p className="mt-1 text-lg text-slate-600 dark:text-slate-300 italic tracking-wide">
                    {wordData.romaji}
                  </p>
                </div>
              )}

              {/* 分隔线 */}
              <hr className="border-slate-300 dark:border-slate-600" />

              {/* 例句 */}
              {wordData.example_ja && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    例文
                  </span>
                  <p className="mt-1 text-base text-slate-700 leading-relaxed">
                    {wordData.example_ja}
                  </p>
                  {wordData.example_zh && (
                    <p className="mt-0.5 text-sm text-slate-400">
                      {wordData.example_zh}
                    </p>
                  )}
                </div>
              )}

              {/* 喇叭按钮 — 朗读当前单词 */}
              <div className="flex justify-center">
                <button
                  onClick={handleSpeak}
                  className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600
                             transition-colors duration-200 active:scale-90"
                  aria-label="朗读"
                >
                  <Volume2 size={20} className="text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              {/* 底部提示 */}
              <span className="absolute bottom-6 text-xs text-slate-400 dark:text-slate-500 tracking-wide self-center">
                点击卡片翻转回日文
              </span>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
