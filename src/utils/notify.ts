/**
 * 新消息通知：提示音 + 浏览器通知 + 标题闪烁
 *
 * 设计：
 * - beep 用 Web Audio 合成，零资源文件依赖
 * - 浏览器通知需首次触发前用户手势授权，未授权时静默降级
 * - 标题闪烁通过 setInterval 切换 document.title，页面 focus 时自动停止
 */

let audioCtx: AudioContext | null = null
function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!Ctor) return null
    audioCtx = new Ctor()
  }
  return audioCtx
}

export function playBeep(): void {
  const ctx = ensureCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = 880
  osc.type = 'sine'
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.26)
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const res = await Notification.requestPermission()
  return res === 'granted'
}

export function browserNotify(title: string, body: string, icon?: string): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (!document.hidden) return
  try {
    const n = new Notification(title, { body, icon, silent: true })
    n.onclick = () => {
      window.focus()
      n.close()
    }
    setTimeout(() => n.close(), 5000)
  } catch {
    // some browsers on non-secure contexts throw
  }
}

let originalTitle = ''
let flashTimer: number | null = null
let flashOn = false

export function flashTitle(unreadCount: number): void {
  if (!document.hidden) return
  if (!originalTitle) originalTitle = document.title
  const badge = `【${unreadCount}条新消息】`
  if (flashTimer != null) clearInterval(flashTimer)
  flashOn = false
  flashTimer = window.setInterval(() => {
    flashOn = !flashOn
    document.title = flashOn ? badge + originalTitle : originalTitle
  }, 1000)
}

export function stopFlash(): void {
  if (flashTimer != null) {
    clearInterval(flashTimer)
    flashTimer = null
  }
  if (originalTitle) document.title = originalTitle
}

let visibilityBound = false
export function bindVisibilityReset(): void {
  if (visibilityBound || typeof document === 'undefined') return
  visibilityBound = true
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) stopFlash()
  })
  window.addEventListener('focus', stopFlash)
}
