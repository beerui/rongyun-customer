/**
 * ready() Promise 管理。boot() 完成 → resolve；reset() → 重新等待下次 boot。
 *
 * 支持场景：
 *   - boot() 前调 ready() → 返回 pending Promise，boot 后自动 resolve
 *   - boot() 后调 ready() → 立即 resolve
 *   - reset() 后 ready 重置，等待下次 boot
 */

let readyPromise: Promise<void> | null = null
let readyResolver: (() => void) | null = null
let isReady = false

function ensurePromise(): Promise<void> {
  if (!readyPromise) {
    readyPromise = new Promise<void>((resolve) => {
      readyResolver = resolve
    })
    if (isReady) {
      // 已 ready 的状态下重建 promise（如 reset 后再 boot 前调用）
      readyResolver?.()
      readyResolver = null
    }
  }
  return readyPromise
}

/** SDK 就绪时由 boot() 调用 */
export function signalReady(): void {
  isReady = true
  ensurePromise()
  readyResolver?.()
  readyResolver = null
}

/** 供外部 await */
export function ready(): Promise<void> {
  return ensurePromise()
}

/** reset 时重置就绪态 */
export function resetReady(): void {
  readyPromise = null
  readyResolver = null
  isReady = false
}

/** 当前是否已就绪（同步查询） */
export function isReadyNow(): boolean {
  return isReady
}
