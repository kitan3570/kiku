import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'

// ── Service Worker 注册 ──────────────────────────────
async function registerSW() {
  if (!('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        registration.active?.postMessage({ type: 'SCHEDULE_REMINDER' })
      }
    }
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'TRIGGER_CHECK') {
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
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
