import { useState, useEffect } from "react";
import { Bell, Target } from "lucide-react";
import api from "../api/axios";

export default function SettingsPage() {
  const [reminderHour, setReminderHour] = useState(20);
  const [dailyGoal, setDailyGoal] = useState(20);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/settings").then(r => {
      setReminderHour(r.data.reminderHour ?? 20);
      setDailyGoal(r.data.dailyGoal ?? 20);
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      await api.put("/settings", { reminderHour, dailyGoal });
      setMsg("✅ 设置已保存");
      setTimeout(() => setMsg(""), 2000);
    } catch { setMsg("保存失败"); }
    finally { setSaving(false); }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:border-indigo-400 min-h-[44px]";

  return (
    <div className="w-full max-w-md space-y-6">
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Target size={20} className="text-indigo-500" /> 设置
      </h2>

      {/* 每日提醒时间 */}
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Bell size={16} /> 每日提醒时间
        </div>
        <select value={reminderHour} onChange={e => setReminderHour(parseInt(e.target.value))} className={inputClass}>
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
          ))}
        </select>
        <p className="text-xs text-gray-400">到设定时间后，如有未复习单词将发送系统通知</p>
      </div>

      {/* 每日复习目标 */}
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Target size={16} /> 每日复习目标
        </div>
        <select value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value))} className={inputClass}>
          {[10, 20, 30, 50, 100, 0].map(n => (
            <option key={n} value={n}>{n === 0 ? "全部" : `${n} 个单词`}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400">每天计划复习的单词数量，0 表示不限量</p>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors min-h-[44px]">
        {saving ? "保存中…" : "保存设置"}
      </button>
      {msg && <p className="text-sm text-center text-emerald-500">{msg}</p>}
    </div>
  );
}
