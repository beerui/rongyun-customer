import { emit, on } from '../events'
import { onReset } from '../lifecycle'
import { buildChatUrl, open } from '../open'
import type { OpenOptions } from '../types'
import type { Unsubscribe } from '../utils/event-emitter'
import { closeWidget, destroyWidget, injectStyles, isWidgetOpen, openWidget, updateTheme } from './widget'

export type LauncherPosition = 'bottom-right' | 'bottom-left'
export type LauncherMode = 'iframe' | 'tab'

export interface LauncherOptions {
  /** 气泡位置，默认 bottom-right */
  position?: LauncherPosition
  /** 主题色（CSS color），默认 #FA3E3E 对齐项目主色 */
  primary?: string
  /** 浮窗标题，默认"在线客服" */
  title?: string
  /** 点击气泡时的开窗参数（身份 / 可选商品卡） */
  openWith: OpenOptions
  /** tab（新开标签）/ iframe（页内浮窗），默认 tab */
  mode?: LauncherMode
  /** 未读数超过此值显示 N+，默认 99 */
  badgeMax?: number
}

interface LauncherInternal {
  root: HTMLButtonElement
  badge: HTMLSpanElement
  opts: LauncherOptions
  unreadUnsub: Unsubscribe
  offReset: () => void
}

let instance: LauncherInternal | null = null

const CHAT_ICON_SVG = `<svg class="daji-cs-launcher-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 9h10v2H7V9zm7 5H7v-2h7v2zm3-6H7V6h10v2z"/></svg>`

function renderBadge(count: number, max: number): string {
  if (!count || count <= 0) return ''
  if (count > max) return max + '+'
  return String(count)
}

function setBadge(badge: HTMLSpanElement, count: number, max: number): void {
  const text = renderBadge(count, max)
  badge.textContent = text
  badge.setAttribute('data-visible', text ? 'true' : 'false')
}

/**
 * 挂载悬浮 Launcher 气泡。重复调用会先卸载旧实例。
 */
export function mountLauncher(options: LauncherOptions): void {
  if (typeof document === 'undefined') return
  if (!options?.openWith?.userId) {
    emit('error', { source: 'mountLauncher', error: new Error('openWith.userId required') })
    return
  }
  if (instance) unmountLauncher()

  injectStyles()
  updateTheme(options.primary)

  const root = document.createElement('button')
  root.type = 'button'
  root.className = 'daji-cs-launcher'
  root.setAttribute('data-position', options.position ?? 'bottom-right')
  root.setAttribute('aria-label', options.title ?? '在线客服')
  root.innerHTML = CHAT_ICON_SVG
  if (options.primary) root.style.setProperty('--daji-cs-primary', options.primary)

  const badge = document.createElement('span')
  badge.className = 'daji-cs-badge'
  badge.setAttribute('data-visible', 'false')
  root.appendChild(badge)

  const badgeMax = options.badgeMax ?? 99
  const unreadUnsub = on('unread:change', ({ count }) => setBadge(badge, count, badgeMax))

  root.addEventListener('click', () => {
    emit('launcher:click', { mode: options.mode ?? 'tab' })
    handleLauncherClick(options)
  })

  document.body.appendChild(root)
  const offReset = onReset(() => unmountLauncher())
  instance = { root, badge, opts: options, unreadUnsub, offReset }
  emit('launcher:mount', { position: options.position ?? 'bottom-right' })
}

async function handleLauncherClick(options: LauncherOptions): Promise<void> {
  const mode = options.mode ?? 'tab'
  try {
    if (mode === 'tab') {
      await open(options.openWith)
      return
    }
    if (isWidgetOpen()) {
      closeWidget('user')
      return
    }
    const url = buildChatUrl(options.openWith)
    openWidget(url, {
      position: options.position ?? 'bottom-right',
      primary: options.primary,
      title: options.title ?? '在线客服',
    })
  } catch (err) {
    // 典型场景：config 被 reset 清空后点击 launcher
    emit('error', { source: 'launcher:click', error: err })
  }
}

export function unmountLauncher(): void {
  if (!instance) return
  instance.unreadUnsub()
  instance.offReset()
  instance.root.remove()
  destroyWidget()
  emit('launcher:unmount', undefined)
  instance = null
}

export function getLauncherElement(): HTMLButtonElement | null {
  return instance?.root ?? null
}

export function setUnreadCount(count: number): void {
  emit('unread:change', { count })
}

/** 允许宿主主动 toggle */
export function toggleWidget(): void {
  if (!instance) return
  handleLauncherClick(instance.opts)
}
