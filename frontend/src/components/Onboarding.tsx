import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, BookOpen, Pencil, BarChart3, Settings } from "lucide-react";

const STEPS = [
  { icon: BookOpen, title: "选择词单", desc: "进入「词库」标签，点击「导入 N5 词单」开始学习。N5 是日语入门级别，包含最常用的 35 个词汇。" },
  { icon: Pencil, title: "复习单词", desc: "在「复习」标签，你会看到今日需要复习的单词。点击卡片翻转查看释义，输入假名做拼写练习。连续答对 3 次自动升级！" },
  { icon: BarChart3, title: "查看统计", desc: "在「统计」标签，追踪你的学习进度。查看准确率趋势、熟悉度分布和每日复习量。" },
  { icon: Settings, title: "自定义设置", desc: "在「设置」标签，调整每日提醒时间和复习目标。默认晚上 20:00 提醒，每天计划复习 20 个单词。" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const finish = () => {
    setDone(true);
    localStorage.setItem("kiku-onboarding", "done");
  };

  if (done) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="w-full max-w-md rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 text-white shadow-xl"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <current.icon size={20} />
            <span className="font-semibold">{current.title}</span>
          </div>
          <button onClick={finish} className="p-1 rounded-full hover:bg-white/20 transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-white/80 mb-4 leading-relaxed">{current.desc}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
          <button onClick={isLast ? finish : () => setStep(s => s + 1)}
            className="flex items-center gap-1 text-sm font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
            {isLast ? "开始使用" : "下一步"} {!isLast && <ChevronRight size={14} />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
