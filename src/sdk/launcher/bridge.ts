/**
 * postMessage 协议与双向桥。
 *
 * 方向：
 *   - iframe(/chat) → parent(SDK)：ready / unread / message / conversation-end / close
 *   - parent(SDK) → iframe(/chat)：identity / ping（supplied via sendToIframe）
 *
 * 安全：
 *   - 收消息时严格校验 event.origin 属于白名单（boot 时从 baseUrl 推导 + 可补充）
 *   - 消息必须带 source='daji-cs'，type 必须是预期字符串
 */

import { emit } from '../events'
import { onReset } from '../lifecycle'
import { closeWidget, getWidgetIframe, showEndBanner } from './widget'

export const DAJI_MSG_SOURCE = 'daji-cs'
export const DAJI_MSG_VERSION = '0.1.0'

export type DajiMsgType =
  | 'daji:ready'
  | 'daji:unread'
  | 'daji:message'
  | 'daji:conversation-end'
  | 'daji:close'
  // parent → iframe
  | 'daji:identity'
  | 'daji:ping'

export interface DajiMessage<T = unknown> {
  source: typeof DAJI_MSG_SOURCE
  version: string
  type: DajiMsgType
  payload: T
}

/** startBridge 的"会话结束"策略选项 */
export interface EndPolicy {
  /** 是否自动关闭 widget。默认 true */
  autoClose?: boolean
  /** 自动关闭前的横幅显示时长（ms）。默认 3000 */
  closeDelay?: number
}

let msgListener: ((event: MessageEvent) => void) | null = null
const allowedOrigins = new Set<string>()
let offResetUnsub: (() => void) | null = null
let endPolicy: Required<EndPolicy> = { autoClose: true, closeDelay: 3000 }
let endCloseTimer: ReturnType<typeof setTimeout> | null = null

function deriveOrigin(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

function isDajiMessage(data: unknown): data is DajiMessage {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return d.source === DAJI_MSG_SOURCE && typeof d.type === 'string'
}

function dispatch(msg: DajiMessage): void {
  switch (msg.type) {
    case 'daji:ready':
      // iframe 已就绪；可选回传身份等（留给 C2 后续）
      break
    case 'daji:unread': {
      const count = Number((msg.payload as { count?: number })?.count ?? 0)
      emit('unread:change', { count })
      break
    }
    case 'daji:message': {
      const p = msg.payload as { from?: string; preview?: string }
      emit('message:incoming', {
        from: String(p?.from ?? ''),
        preview: p?.preview,
      })
      break
    }
    case 'daji:conversation-end': {
      const reason = (msg.payload as { reason?: string })?.reason
      emit('conversation:end', { reason })
      if (endPolicy.autoClose) scheduleEndAutoClose(reason)
      break
    }
    case 'daji:close':
      closeWidget('programmatic')
      break
    default:
      // identity / ping / 未知类型忽略（避免未定义行为）
      break
  }
}

/**
 * 启动 postMessage 监听。幂等：重复调用先停旧的。
 * @param baseUrl SDK 指向的客服站点根 —— 它的 origin 自动加入白名单
 * @param additional 额外允许的 origin 列表（允许 URL 或 origin 字符串）
 * @param policy   "会话结束"策略（默认 autoClose=true, closeDelay=3000）
 */
export function startBridge(baseUrl: string, additional?: string[], policy?: EndPolicy): void {
  if (typeof window === 'undefined') return
  stopBridge()

  endPolicy = {
    autoClose: policy?.autoClose ?? true,
    closeDelay: Math.max(0, policy?.closeDelay ?? 3000),
  }

  const base = deriveOrigin(baseUrl)
  if (base) allowedOrigins.add(base)
  for (const o of additional ?? []) {
    const orig = deriveOrigin(o) ?? o
    if (orig) allowedOrigins.add(orig)
  }

  msgListener = (event: MessageEvent) => {
    if (!allowedOrigins.has(event.origin)) return
    if (!isDajiMessage(event.data)) return
    try {
      dispatch(event.data)
    } catch (err) {
      emit('error', { source: 'bridge:dispatch', error: err })
    }
  }
  window.addEventListener('message', msgListener)
  offResetUnsub = onReset(() => stopBridge())
}

export function stopBridge(): void {
  if (msgListener && typeof window !== 'undefined') {
    window.removeEventListener('message', msgListener)
  }
  msgListener = null
  allowedOrigins.clear()
  if (endCloseTimer) {
    clearTimeout(endCloseTimer)
    endCloseTimer = null
  }
  offResetUnsub?.()
  offResetUnsub = null
}

function scheduleEndAutoClose(reason?: string): void {
  if (endCloseTimer) clearTimeout(endCloseTimer)
  const msg = reason === 'user' ? '您已结束本次会话' : '会话已结束，感谢您的咨询'
  showEndBanner(msg, endPolicy.closeDelay)
  if (endPolicy.closeDelay === 0) {
    closeWidget('programmatic')
    return
  }
  endCloseTimer = setTimeout(() => {
    endCloseTimer = null
    closeWidget('programmatic')
  }, endPolicy.closeDelay)
}

/** 当前是否有活跃 bridge（调试用） */
export function isBridgeActive(): boolean {
  return msgListener !== null
}

/** 当前已允许的 origin 清单（调试用） */
export function getAllowedOrigins(): string[] {
  return [...allowedOrigins]
}

/**
 * 向 iframe 内的 /chat 页发消息。targetOrigin 默认从 allowed 第一项取。
 *
 * @param type   协议类型（daji:identity / daji:ping / 自定义）
 * @param payload
 * @param targetOrigin 默认使用 allowedOrigins 第一个；强烈建议显式传值
 */
export function sendToWidgetIframe(type: DajiMsgType, payload?: unknown, targetOrigin?: string): boolean {
  const iframe = getWidgetIframe()
  if (!iframe?.contentWindow) return false
  const origin = targetOrigin ?? [...allowedOrigins][0] ?? '*'
  const msg: DajiMessage = {
    source: DAJI_MSG_SOURCE,
    version: DAJI_MSG_VERSION,
    type,
    payload: payload ?? null,
  }
  iframe.contentWindow.postMessage(msg, origin)
  return true
}

/** 向 window.open 出去的客服窗口发消息（新 tab 模式） */
export function sendToOpenWindow(win: Window, type: DajiMsgType, payload?: unknown, targetOrigin?: string): boolean {
  if (!win || win.closed) return false
  const origin = targetOrigin ?? [...allowedOrigins][0] ?? '*'
  const msg: DajiMessage = {
    source: DAJI_MSG_SOURCE,
    version: DAJI_MSG_VERSION,
    type,
    payload: payload ?? null,
  }
  try {
    win.postMessage(msg, origin)
    return true
  } catch {
    return false
  }
}
