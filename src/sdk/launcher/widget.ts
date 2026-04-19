import { emit } from '../events'
import { STYLE_ID, CSS } from './styles'

let styleEl: HTMLStyleElement | null = null
let widgetEl: HTMLDivElement | null = null
let iframeEl: HTMLIFrameElement | null = null
let endBannerEl: HTMLDivElement | null = null
let endBannerTimer: ReturnType<typeof setTimeout> | null = null
let isOpen = false

export type WidgetPosition = 'bottom-right' | 'bottom-left'

export interface WidgetState {
  position: WidgetPosition
  primary: string
  title: string
}

const state: WidgetState = {
  position: 'bottom-right',
  primary: '#FA3E3E',
  title: '在线客服',
}

/** 惰性注入 style 标签（多次调用幂等） */
export function injectStyles(): void {
  if (typeof document === 'undefined') return
  if (styleEl || document.getElementById(STYLE_ID)) return
  styleEl = document.createElement('style')
  styleEl.id = STYLE_ID
  styleEl.textContent = CSS
  document.head.appendChild(styleEl)
}

export function updateTheme(primary?: string): void {
  if (!primary) return
  state.primary = primary
  document.documentElement.style.setProperty('--daji-cs-primary', primary)
}

function ensureWidgetDom(): HTMLDivElement {
  if (widgetEl) return widgetEl
  widgetEl = document.createElement('div')
  widgetEl.className = 'daji-cs-widget'
  widgetEl.setAttribute('data-position', state.position)
  widgetEl.setAttribute('data-open', 'false')
  widgetEl.setAttribute('role', 'dialog')
  widgetEl.setAttribute('aria-label', state.title)

  const head = document.createElement('div')
  head.className = 'daji-cs-widget-head'
  head.innerHTML = `
    <span class="daji-cs-widget-title"></span>
    <div class="daji-cs-widget-actions">
      <button class="daji-cs-widget-btn" data-action="minimize" title="最小化" aria-label="最小化">
        <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="2" rx="1"/></svg>
      </button>
      <button class="daji-cs-widget-btn" data-action="close" title="关闭" aria-label="关闭">
        <svg viewBox="0 0 24 24"><path d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.4L10.58 13.4 4.3 19.7l1.41 1.4L12 14.83l6.3 6.28 1.41-1.4-6.29-6.3 6.29-6.29z"/></svg>
      </button>
    </div>`
  ;(head.querySelector('.daji-cs-widget-title') as HTMLElement).textContent = state.title

  head.querySelector('[data-action="close"]')?.addEventListener('click', () => closeWidget())
  head.querySelector('[data-action="minimize"]')?.addEventListener('click', () => closeWidget('minimize'))

  iframeEl = document.createElement('iframe')
  iframeEl.setAttribute('title', state.title)
  iframeEl.setAttribute('allow', 'microphone; camera; autoplay; clipboard-read; clipboard-write')
  iframeEl.setAttribute('referrerpolicy', 'origin')

  widgetEl.appendChild(head)
  widgetEl.appendChild(iframeEl)
  document.body.appendChild(widgetEl)
  return widgetEl
}

export function openWidget(url: string, opts?: Partial<WidgetState>): void {
  if (typeof document === 'undefined') return
  injectStyles()
  if (opts?.position) state.position = opts.position
  if (opts?.title) state.title = opts.title
  updateTheme(opts?.primary)

  const el = ensureWidgetDom()
  el.setAttribute('data-position', state.position)
  if (iframeEl && iframeEl.src !== url) iframeEl.src = url
  // 触发动画：下一帧再打开
  requestAnimationFrame(() => {
    el.setAttribute('data-open', 'true')
  })
  if (!isOpen) {
    isOpen = true
    emit('widget:open', { url })
  }
}

export function closeWidget(reason: 'user' | 'minimize' | 'programmatic' = 'user'): void {
  if (!widgetEl || !isOpen) return
  widgetEl.setAttribute('data-open', 'false')
  isOpen = false
  hideEndBanner()
  emit('widget:close', { reason })
}

export function destroyWidget(): void {
  closeWidget('programmatic')
  if (widgetEl) widgetEl.remove()
  widgetEl = null
  iframeEl = null
  endBannerEl = null
}

export function getWidgetIframe(): HTMLIFrameElement | null {
  return iframeEl
}

export function isWidgetOpen(): boolean {
  return isOpen
}

/**
 * 在 widget 顶部显示一条"会话已结束"横幅。autoHideMs 为隐藏延迟。
 * 仅对已存在的 widget 有效——未开窗时无操作。
 */
export function showEndBanner(message = '会话已结束', autoHideMs?: number): void {
  if (!widgetEl) return
  if (endBannerTimer) {
    clearTimeout(endBannerTimer)
    endBannerTimer = null
  }
  if (!endBannerEl) {
    endBannerEl = document.createElement('div')
    endBannerEl.className = 'daji-cs-widget-end-banner'
    widgetEl.appendChild(endBannerEl)
  }
  endBannerEl.textContent = message
  requestAnimationFrame(() => {
    endBannerEl?.setAttribute('data-visible', 'true')
  })
  if (autoHideMs && autoHideMs > 0) {
    endBannerTimer = setTimeout(() => {
      endBannerEl?.setAttribute('data-visible', 'false')
      endBannerTimer = null
    }, autoHideMs)
  }
}

export function hideEndBanner(): void {
  if (endBannerTimer) {
    clearTimeout(endBannerTimer)
    endBannerTimer = null
  }
  endBannerEl?.setAttribute('data-visible', 'false')
}
