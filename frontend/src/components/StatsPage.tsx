import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import api from "../api/axios";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];
const LEVEL_LABELS = ["不会", "眼熟", "认识", "熟悉", "掌握", "精通"];

export default function StatsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [accuracy, setAccuracy] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);

  useEffect(() => {
    api.get("/stats/overview").then(r => setOverview(r.data)).catch(()=>{});
    api.get("/stats/accuracy").then(r => setAccuracy(r.data.data)).catch(()=>{});
    api.get("/stats/levels").then(r => {
      const d = (r.data.data || []).map((x: any) => ({ name: LEVEL_LABELS[x.familiarity] || `L${x.familiarity}`, value: x.count }));
      setLevels(d);
    }).catch(()=>{});
  }, []);

  if (!overview) return <div className="py-20 text-gray-400 text-sm text-center">加载中…</div>;

  return (
    <div className="w-full max-w-2xl space-y-6 pb-8">
      {/* 概览卡片 */}
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

      {/* 准确率趋势 */}
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

      {/* 熟悉度分布 */}
      <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">熟悉度分布</h3>
        {levels.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">暂无数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={levels} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {levels.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, color: "#f3f4f6" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 复习量柱状图 */}
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
