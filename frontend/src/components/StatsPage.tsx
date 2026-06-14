import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import api from "../api/axios";
import Heatmap from "./Heatmap";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];
const LEVEL_LABELS = ["不会", "眼熟", "认识", "熟悉", "掌握", "精通"];

// Mock 数据 — 无真实数据时展示效果
const MOCK_OVERVIEW = { totalWords: 65, mastered: 12, todayDue: 20, todayDone: 8 };
const MOCK_ACCURACY = [
  { date: "06-01", total: 15, correct: 12, rate: 80 },
  { date: "06-02", total: 20, correct: 16, rate: 80 },
  { date: "06-03", total: 18, correct: 14, rate: 78 },
  { date: "06-04", total: 22, correct: 18, rate: 82 },
  { date: "06-05", total: 16, correct: 14, rate: 88 },
  { date: "06-06", total: 25, correct: 22, rate: 88 },
  { date: "06-07", total: 0, correct: 0, rate: 0 },
  { date: "06-08", total: 20, correct: 17, rate: 85 },
  { date: "06-09", total: 24, correct: 21, rate: 88 },
  { date: "06-10", total: 18, correct: 16, rate: 89 },
  { date: "06-11", total: 22, correct: 20, rate: 91 },
  { date: "06-12", total: 20, correct: 19, rate: 95 },
  { date: "06-13", total: 26, correct: 24, rate: 92 },
  { date: "06-14", total: 14, correct: 13, rate: 93 },
];
const MOCK_LEVELS = [
  { name: "不会", value: 15 }, { name: "眼熟", value: 20 },
  { name: "认识", value: 18 }, { name: "熟悉", value: 12 },
  { name: "掌握", value: 8 }, { name: "精通", value: 5 },
];

export default function StatsPage() {
  const [overview, setOverview] = useState(MOCK_OVERVIEW);
  const [accuracy, setAccuracy] = useState(MOCK_ACCURACY);
  const [levels, setLevels] = useState(MOCK_LEVELS);

  useEffect(() => {
    api.get("/stats/overview").then(r => { if (r.data?.totalWords > 0) setOverview(r.data); }).catch(() => {});
    api.get("/stats/accuracy").then(r => { if (r.data?.data?.length) setAccuracy(r.data.data); }).catch(() => {});
    api.get("/stats/levels").then(r => {
      const d = (r.data?.data || []) as any[];
      if (d.length) setLevels(d.map(x => ({ name: LEVEL_LABELS[x.familiarity] || `L${x.familiarity}`, value: x.count })));
    }).catch(() => {});
  }, []);

  return (
    <div className="w-full max-w-2xl space-y-6 pb-8">
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
        {overview === MOCK_OVERVIEW ? "📊 学习统计 (示例数据)" : "📊 学习统计"}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["总单词", overview.totalWords, "text-indigo-500"],
          ["已掌握", overview.mastered, "text-emerald-500"],
          ["今日待复习", overview.todayDue, "text-amber-500"],
          ["今日已复习", overview.todayDone, "text-blue-500"],
        ].map(([label, val, color]) => (
          <div key={label as string} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-center">
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <Heatmap />

      <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">准确率趋势 (近14天)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={accuracy}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, color: "#f3f4f6" }} />
            <Line type="monotone" dataKey="rate" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} name="准确率 %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">熟悉度分布</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={levels} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
              {levels.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, color: "#f3f4f6" }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">每日复习量</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={accuracy}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, color: "#f3f4f6" }} />
            <Bar dataKey="total" fill="#818cf8" radius={[4,4,0,0]} name="复习数" />
            <Bar dataKey="correct" fill="#34d399" radius={[4,4,0,0]} name="正确" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
