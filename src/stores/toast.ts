import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastKind = 'info' | 'success' | 'error' | 'warning'

export interface ToastItem {
  id: number
  kind: ToastKind
  message: string
  /** ms，默认 3000；0 表示不自动关 */
  duration: number
}

let seq = 0

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([])

  function push(kind: ToastKind, message: string, duration = 3000): number {
    const id = ++seq
    items.value.push({ id, kind, message, duration })
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }

  function dismiss(id: number) {
    const i = items.value.findIndex((it) => it.id === id)
    if (i > -1) items.value.splice(i, 1)
  }

  function clear() { items.value = [] }

  return {
    items,
    info:    (m: string, d?: number) => push('info', m, d),
    success: (m: string, d?: number) => push('success', m, d),
    error:   (m: string, d?: number) => push('error', m, d ?? 4000),
    warning: (m: string, d?: number) => push('warning', m, d),
    dismiss, clear,
  }
})

/**
 * 非组件环境的便捷调用（需确保 pinia 已 use）。
 * 组件里建议直接 useToastStore() 保持响应式一致。
 */
export const toast = {
  info:    (m: string, d?: number) => useToastStore().info(m, d),
  success: (m: string, d?: number) => useToastStore().success(m, d),
  error:   (m: string, d?: number) => useToastStore().error(m, d),
  warning: (m: string, d?: number) => useToastStore().warning(m, d),
}
