/**
 * 类型安全的轻量事件总线。
 * 泛型参数 `M` 映射事件名 → payload 类型。
 */

export type Listener<P> = (payload: P) => void
export type Unsubscribe = () => void

export class EventEmitter<M extends Record<string, unknown>> {
  private listeners: { [K in keyof M]?: Set<Listener<M[K]>> } = {}

  on<K extends keyof M>(event: K, fn: Listener<M[K]>): Unsubscribe {
    let bucket = this.listeners[event]
    if (!bucket) {
      bucket = new Set()
      this.listeners[event] = bucket
    }
    bucket.add(fn)
    return () => this.off(event, fn)
  }

  once<K extends keyof M>(event: K, fn: Listener<M[K]>): Unsubscribe {
    const wrapper: Listener<M[K]> = (payload) => {
      off()
      fn(payload)
    }
    const off = this.on(event, wrapper)
    return off
  }

  off<K extends keyof M>(event: K, fn: Listener<M[K]>): void {
    this.listeners[event]?.delete(fn)
  }

  emit<K extends keyof M>(event: K, payload: M[K]): void {
    const bucket = this.listeners[event]
    if (!bucket) return
    // 复制一份避免订阅者在回调中 off 导致迭代异常
    for (const fn of [...bucket]) {
      try {
        fn(payload)
      } catch (err) {
        // 订阅者抛错不应中断其它订阅者；打日志并继续
        console.error('[DajiCS] listener error on event', event, err)
      }
    }
  }

  /** 移除所有监听（供 reset 使用） */
  clear(): void {
    this.listeners = {}
  }

  /** 某事件当前的订阅数（测试用） */
  count<K extends keyof M>(event: K): number {
    return this.listeners[event]?.size ?? 0
  }
}
