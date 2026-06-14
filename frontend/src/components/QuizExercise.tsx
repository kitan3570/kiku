import { useState, useEffect, useCallback } from "react";
import { Volume2 } from "lucide-react";
import api from "../api/axios";
import { playJapaneseSpeech } from "../utils/tts";

interface QuizData { found: boolean; wordId: number; question: { prompt: string; hint?: string; type: string }; choices: string[]; answer: string; answerExtra: string; }

export default function QuizExercise({ onResult }: { onResult: (wordId: number, isCorrect: boolean) => void }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [mode, setMode] = useState<"ja2zh" | "zh2ja">("ja2zh");

  const fetchQuiz = useCallback(async () => {
    setSelected(null); setFeedback(null); setShowAnswer(false);
    try { const { data } = await api.get(`/review/quiz?mode=${mode}`); setQuiz(data.found ? data : null); }
    catch { setQuiz(null); }
  }, [mode]);

  useEffect(() => { fetchQuiz(); }, [fetchQuiz]);

  const handleChoice = (choice: string) => {
    if (!quiz || feedback) return;
    setSelected(choice);
    const correct = choice === quiz.answer;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) { setTimeout(() => onResult(quiz.wordId, true), 800); }
    else { setShowAnswer(true); setTimeout(() => onResult(quiz.wordId, false), 2000); }
  };

  if (!quiz) return <div className="py-10 text-center text-gray-400 text-sm">没有更多题目了 🎉</div>;

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {mode === "ja2zh" ? "日→中" : "中→日"} · 选正确的释义
        </span>
        <button onClick={() => setMode(m => m === "ja2zh" ? "zh2ja" : "ja2zh")}
          className="text-xs text-indigo-500 hover:underline">切换方向</button>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 text-center border border-indigo-100 dark:border-indigo-900/30">
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{quiz.question.prompt}</p>
        {quiz.question.hint && <p className="text-lg text-gray-400">{quiz.question.hint}</p>}
        <button onClick={() => playJapaneseSpeech(quiz.question.prompt)}
          className="mt-3 p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 hover:bg-indigo-200 transition-colors">
          <Volume2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {quiz.choices.map((c, i) => {
          let border = "border-gray-200 dark:border-gray-700 hover:border-indigo-300";
          if (selected === c) {
            border = feedback === "correct" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" :
              c === quiz.answer ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-red-400 bg-red-50 dark:bg-red-900/20";
          }
          if (showAnswer && c === quiz.answer && selected !== c) {
            border = "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20";
          }
          return (
            <button key={i} onClick={() => handleChoice(c)} disabled={!!feedback}
              className={`p-3 rounded-xl border-2 ${border} text-sm text-gray-700 dark:text-gray-300 font-medium transition-all min-h-[44px]`}>
              {c}
            </button>
          );
        })}
      </div>

      {showAnswer && quiz.answerExtra && (
        <p className="text-center text-xs text-gray-500">答案假名：{quiz.answerExtra}</p>
      )}
    </div>
  );
}
