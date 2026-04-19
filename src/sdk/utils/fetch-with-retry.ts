/**
 * 带超时 / 重试 / AbortController 的 fetch 封装。
 * 独立无外部依赖，IIFE 构建友好。
 */

export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public response: Response,
  ) {
    super(`HTTP ${status} ${statusText}`)
    this.name = 'HttpError'
  }
}

export class TimeoutError extends Error {
  constructor(public timeoutMs: number) {
    super(`Request timeout after ${timeoutMs}ms`)
    this.name = 'TimeoutError'
  }
}

export interface FetchWithRetryOptions extends Omit<RequestInit, 'signal'> {
  /** 单次请求超时，毫秒，默认 8000 */
  timeout?: number
  /** 最大重试次数（不含首次），默认 2 */
  maxRetries?: number
  /** 指数退避基数，毫秒。第 n 次重试等待 base * 2^(n-1)（0,300,600,1200…），默认 300 */
  backoffBase?: number
  /** 自定义"是否重试"策略，覆盖默认 */
  shouldRetry?: (err: unknown, attempt: number) => boolean
  /** 外部 abort signal（与内部 timeout 合并） */
  signal?: AbortSignal
  /** 调试日志 */
  debug?: boolean
}

/**
 * 默认重试策略：
 * - 超时 / 网络错误：重试
 * - HTTP 5xx / 408 / 429：重试
 * - 其它 4xx：不重试（重试同样会失败）
 * - AbortError（外部主动取消）：不重试
 */
export function defaultShouldRetry(err: unknown, _attempt: number): boolean {
  if (err instanceof TimeoutError) return true
  if (err instanceof HttpError) {
    const s = err.status
    return s >= 500 || s === 408 || s === 429
  }
  if (err instanceof DOMException && err.name === 'AbortError') return false
  if (err instanceof TypeError) return true
  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mergeSignals(
  external: AbortSignal | undefined,
  internal: AbortController,
): void {
  if (!external) return
  if (external.aborted) {
    internal.abort(external.reason)
    return
  }
  external.addEventListener('abort', () => internal.abort(external.reason), {
    once: true,
  })
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const {
    timeout = 8000,
    maxRetries = 2,
    backoffBase = 300,
    shouldRetry = defaultShouldRetry,
    signal: externalSignal,
    debug = false,
    ...init
  } = options

  let attempt = 0
  let lastError: unknown

  while (attempt <= maxRetries) {
    const controller = new AbortController()
    mergeSignals(externalSignal, controller)
    const timer = setTimeout(() => controller.abort(new TimeoutError(timeout)), timeout)

    try {
      const res = await fetch(url, { ...init, signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) throw new HttpError(res.status, res.statusText, res)
      return res
    } catch (err) {
      clearTimeout(timer)
      // 外部 signal 触发的 abort 直接透传，不重试
      if (externalSignal?.aborted) throw err
      // 内部 timeout 包装成 TimeoutError
      if (err instanceof DOMException && err.name === 'AbortError' && controller.signal.reason instanceof TimeoutError) {
        lastError = controller.signal.reason
      } else {
        lastError = err
      }
      if (debug) console.warn(`[DajiCS][fetch] attempt ${attempt + 1} failed:`, lastError)
      if (attempt === maxRetries || !shouldRetry(lastError, attempt + 1)) break
      const wait = backoffBase * Math.pow(2, attempt)
      await sleep(wait)
      attempt++
    }
  }

  throw lastError
}
