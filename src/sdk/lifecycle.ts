/**
 * SDK 内部生命周期钩子。
 *
 * 允许各子模块（launcher / widget 等）在 reset() 被调用时自动清理自己的
 * DOM / 状态，避免 open.ts 的 reset() 需要反向 import 所有子模块造成循环依赖。
 *
 * 与用户事件总线（events.ts）解耦：reset 钩子是 SDK 内部约定，不暴露给宿主。
 */

type ResetHandler = () => void
const resetHandlers: Set<ResetHandler> = new Set()

/** 注册 reset 回调；返回取消注册函数 */
export function onReset(fn: ResetHandler): () => void {
  resetHandlers.add(fn)
  return () => resetHandlers.delete(fn)
}

/** 供 reset() 调用：按注册顺序调用所有 handler（快照遍历，允许 handler 内反注册） */
export function triggerReset(): void {
  for (const fn of [...resetHandlers]) {
    try {
      fn()
    } catch (err) {
      console.error('[DajiCS] reset handler error', err)
    }
  }
}
