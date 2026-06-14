import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

// ── Service Worker 注册 ──────────────────────────────
async function registerSW() {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        // 通知 SW 开始定时检查
        registration.active?.postMessage({ type: 'SCHEDULE_REMINDER' })
      }
    }

    // 监听 SW 发来的消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'TRIGGER_CHECK') {
        // SW 提醒主线程检查今日复习状态
        window.dispatchEvent(new CustomEvent('kiku:check-reminder'))
      }
    })
  } catch (err) {
    console.warn('[SW] Registration failed:', err)
  }
}

registerSW()

// ── 挂载应用 ─────────────────────────────────────────
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
