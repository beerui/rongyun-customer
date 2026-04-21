/**
 * 客服访客端（/chat 路由）专用：向 parent（宿主 SDK）发 daji-cs 协议消息。
 *
 * 与 `src/sdk/launcher/bridge.ts` 一一对应的协议定义。SDK 侧监听这些消息并
 * 转发到事件总线（激活 unread:change / message:incoming / conversation:end 等事件）。
 *
 * 非 iframe 场景（直接访问 /chat）全部 no-op，不影响用户端正常使用。
 */

const DAJI_MSG_SOURCE = 'daji-cs'
const DAJI_MSG_VERSION = '0.1.0'

export type EmbedMsgType = 'daji:ready' | 'daji:unread' | 'daji:message' | 'daji:conversation-end' | 'daji:close'

export interface EmbedMessage<T = unknown> {
  source: typeof DAJI_MSG_SOURCE
  version: string
  type: EmbedMsgType
  payload: T
}

export function isEmbedded(): boolean {
  try {
    return typeof window !== 'undefined' && window.parent !== window
  } catch {
    return false
  }
}

/**
 * 推导 parent 的 origin，优先用 document.referrer；取不到用 '*'。
 *
 * 使用 '*' 作为 targetOrigin 时，payload 会被广播给任何同 iframe 嵌套层的窗口。
 * 生产建议：SDK 在挂载 iframe 前通过 query 下发 hostOrigin，/chat 读取后用它。
 * 本期先用 referrer 推导，已满足绝大多数场景。
 */
function getParentOrigin(): string {
  if (typeof document === 'undefined') return '*'
  const ref = document.referrer
  if (!ref) return '*'
  try {
    return new URL(ref).origin
  } catch {
    return '*'
  }
}

/** 向 parent 发送 daji 协议消息。非 iframe 场景 no-op。 */
export function sendToParent<T>(type: EmbedMsgType, payload?: T): void {
  if (!isEmbedded()) return
  const msg: EmbedMessage<T | null> = {
    source: DAJI_MSG_SOURCE,
    version: DAJI_MSG_VERSION,
    type,
    payload: (payload ?? null) as T | null,
  }
  try {
    window.parent.postMessage(msg, getParentOrigin())
  } catch (e) {
    console.warn('[daji-embed-bridge] postMessage failed', e)
  }
}

/** 监听 parent 下发的 daji 协议消息（如 identity 补发）。返回取消函数。 */
export function onParentMessage(handler: (type: string, payload: unknown) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: MessageEvent) => {
    const data = e.data
    if (!data || typeof data !== 'object') return
    if ((data as { source?: unknown }).source !== DAJI_MSG_SOURCE) return
    const type = String((data as { type?: unknown }).type ?? '')
    if (!type) return
    handler(type, (data as { payload?: unknown }).payload)
  }
  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}
