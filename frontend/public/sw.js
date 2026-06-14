/**
 * Kiku — Service Worker（每日复习提醒通知）
 *
 * 策略：
 *   - 主线程在加载完今日复习数据后，通过 postMessage 告知 SW
 *   - 若当前时间 >= 20:00 且有未复习单词，SW 触发系统通知
 *   - 也监听 periodic-sync（若浏览器支持）做定时检查
 */

const SW_VERSION = "1";

// ── 安装 ─────────────────────────────────────────────
self.addEventListener("install", () => {
  (self as any).skipWaiting?.();
});

// ── 激活 ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil((self as any).clients.claim?.());
});

// ── 消息处理 ─────────────────────────────────────────
self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};

  if (type === "CHECK_REVIEW_REMINDER") {
    const { pendingCount } = payload || {};
    checkAndNotify(pendingCount);
  }

  if (type === "SCHEDULE_REMINDER") {
    // 主线程请求设置定时提醒
    scheduleReminder();
  }
});

// ── 通知逻辑 ─────────────────────────────────────────
function checkAndNotify(pendingCount: number) {
  const now = new Date();
  const hour = now.getHours();

  // 仅在晚上 20:00 – 23:59 之间触发
  if (hour < 20 || hour > 23) return;
  if (!pendingCount || pendingCount <= 0) return;

  showNotification(pendingCount);
}

function showNotification(count: number) {
  const title = "聞く Kiku";
  const options: NotificationOptions = {
    body: `是时候温习今天的日语单词了！还有 ${count} 个单词等待复习。`,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    tag: "kiku-daily-reminder", // 防重复
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  (self as any as ServiceWorkerGlobalScope).registration.showNotification(title, options);
}

// ── 定时提醒（简单 setInterval 方案） ────────────────
let reminderTimer: ReturnType<typeof setInterval> | null = null;

function scheduleReminder() {
  if (reminderTimer) return;

  // 每分钟检查一次是否到了 20:00
  reminderTimer = setInterval(() => {
    const now = new Date();
    if (now.getHours() === 20 && now.getMinutes() === 0) {
      // 到了 20:00，通知主线程检查
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "TRIGGER_CHECK" });
        });
      });
    }
  }, 60_000);
}

// ── 通知点击 ─────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow("/");
      }
    })
  );
});
