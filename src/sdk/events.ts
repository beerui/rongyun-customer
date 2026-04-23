import type { OpenOptions, ProductCard } from './types'
import { EventEmitter, type Listener, type Unsubscribe } from './utils/event-emitter'

/**
 * SDK 对外事件表。
 * 键：事件名（冒号命名空间），值：payload 类型。
 */
export type DajiCSEventMap = {
  /** SDK 首次 boot 完成触发一次 */
  'ready': void

  /** 成功打开客服标签页（浏览器自动复用同名窗口） */
  'window:open': { key: string; url: string }

  /** 开始预投商品卡 */
  'presend:start': { clientMsgId: string; card: ProductCard; opts: OpenOptions }
  /** 预投商品卡成功 */
  'presend:success': { clientMsgId: string }
  /** 预投商品卡失败（已重试到达上限） */
  'presend:error': { clientMsgId: string; error: unknown }

  /** 未读数变化（等 C 阶段 postMessage 对接，B 阶段先占位） */
  'unread:change': { count: number }
  /** 客服侧有新消息 */
  'message:incoming': { from: string; preview?: string }
  /** 会话被客服结束 */
  'conversation:end': { reason?: string }

  /** Launcher 气泡挂载完成 */
  'launcher:mount': { position: 'bottom-right' | 'bottom-left' }
  /** 用户点击 Launcher 气泡 */
  'launcher:click': { mode: 'iframe' | 'tab' }
  /** Launcher 气泡被卸载 */
  'launcher:unmount': void

  /** iframe Widget 打开 */
  'widget:open': { url: string }
  /** iframe Widget 关闭 */
  'widget:close': { reason: 'user' | 'minimize' | 'programmatic' }

  /** 其它未分类错误（boot / 内部状态异常等） */
  'error': { source: string; error: unknown }
}

export type DajiCSEventType = keyof DajiCSEventMap
export type DajiCSListener<K extends DajiCSEventType> = Listener<DajiCSEventMap[K]>

const emitter = new EventEmitter<DajiCSEventMap>()

/** 订阅事件，返回取消函数 */
export function on<K extends DajiCSEventType>(event: K, fn: DajiCSListener<K>): Unsubscribe {
  return emitter.on(event, fn)
}

/** 订阅一次后自动取消 */
export function once<K extends DajiCSEventType>(event: K, fn: DajiCSListener<K>): Unsubscribe {
  return emitter.once(event, fn)
}

/** 主动取消订阅 */
export function off<K extends DajiCSEventType>(event: K, fn: DajiCSListener<K>): void {
  emitter.off(event, fn)
}

/** 内部使用：派发事件 */
export function emit<K extends DajiCSEventType>(event: K, payload: DajiCSEventMap[K]): void {
  emitter.emit(event, payload)
}

/** 内部使用：reset 时清空所有订阅 */
export function clearAllListeners(): void {
  emitter.clear()
}

/** 调试：某事件订阅数 */
export function listenerCount<K extends DajiCSEventType>(event: K): number {
  return emitter.count(event)
}
