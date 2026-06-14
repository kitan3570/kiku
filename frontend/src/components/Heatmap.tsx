import { useState, useEffect } from "react";
import api from "../api/axios";

export default function Heatmap() {
  const [data, setData] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    api.get("/stats/heatmap").then(r => {
      const map: Record<string, number> = {};
      (r.data.data || []).forEach((d: any) => { map[d.date] = d.count; });
      setData(map);
    }).catch(() => {});
    api.get("/stats/streak").then(r => setStreak(r.data.streak || 0)).catch(() => {});
  }, []);

  // 生成最近 20 周 × 7 天的网格
  const today = new Date();
  const weeks = 20;
  const days: { date: string; count: number; level: number }[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (w * 7 + d));
      const key = date.toISOString().slice(0, 10);
      const count = data[key] || 0;
      const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4;
      days.push({ date: key, count, level });
    }
  }

  const colors = ["bg-gray-100 dark:bg-gray-800", "bg-emerald-200 dark:bg-emerald-900", "bg-emerald-400 dark:bg-emerald-600", "bg-emerald-500 dark:bg-emerald-500", "bg-emerald-700 dark:bg-emerald-400"];

  return (
    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          学习热力图 (近 20 周)
        </h3>
        {streak > 0 && (
          <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
            🔥 连续 {streak} 天打卡
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="inline-flex gap-[2px]">
          {Array.from({ length: weeks }).map((_, w) => (
            <div key={w} className="flex flex-col gap-[2px]">
              {Array.from({ length: 7 }).map((_, d) => {
                const idx = w * 7 + d;
                const item = days[idx];
                return (
                  <div key={d} className={`w-3 h-3 rounded-sm ${colors[item.level]}`}
                    title={`${item.date}: ${item.count} 次复习`} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
        <span>少</span>
        {colors.map((c, i) => <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />)}
        <span>多</span>
      </div>
    </div>
  );
}
