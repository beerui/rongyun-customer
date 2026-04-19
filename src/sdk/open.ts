import type { DajiCSBootOptions, OpenOptions } from './types'
import { buildQuery } from './query'
import { preSendProductCard } from './pre-send'
import { emit, clearAllListeners } from './events'
import { signalReady, resetReady, ready as readyPromise, isReadyNow } from './ready'

const DEFAULT_FEATURES = 'width=1000,height=600,scrollbars=yes,resizable=yes'
const VERSION = '0.1.0'
const CLOSE_POLL_INTERVAL_MS = 1000

let config: DajiCSBootOptions | null = null

/** 已打开的客服窗口缓存：key = `${userId}|${supplierId}` */
const openedWindows: Map<string, Window> = new Map()
let closePollTimer: ReturnType<typeof setInterval> | null = null

function log(...args: unknown[]): void {
  if (config?.debug) console.log('[DajiCS]', ...args)
}

function warn(...args: unknown[]): void {
  console.warn('[DajiCS]', ...args)
}

export function boot(options: DajiCSBootOptions): void {
  if (!options?.baseUrl) throw new Error('DajiCS.boot: baseUrl required')
  if (!options?.apiBase) throw new Error('DajiCS.boot: apiBase required')

  if (config) {
    const changed =
      config.baseUrl !== options.baseUrl ||
      config.apiBase !== options.apiBase
    if (changed) {
      warn('boot() called again with different config — ignoring. Call DajiCS.reset() first to re-boot.')
      return
    }
    log('boot() called again with identical config — no-op.')
    return
  }
  config = { ...options, version: options.version ?? VERSION }
  log('booted', config)
  signalReady()
  emit('ready', undefined)
}

/** 显式重置配置（测试 / 需要切换环境时使用） */
export function reset(): void {
  config = null
  openedWindows.clear()
  stopClosePoll()
  resetReady()
  clearAllListeners()
}

function ensureBooted(): DajiCSBootOptions {
  if (!config) throw new Error('DajiCS: call boot() before open()')
  return config
}

function buildUrl(cfg: DajiCSBootOptions, opts: OpenOptions): string {
  const root = cfg.baseUrl.replace(/\/$/, '')
  const qs = buildQuery(opts, cfg.version ?? VERSION)
  return `${root}/chat${qs ? '?' + qs : ''}`
}

/** 公共：根据当前 boot 配置构造 /chat URL（供 launcher iframe 模式使用） */
export function buildChatUrl(opts: OpenOptions): string {
  return buildUrl(ensureBooted(), opts)
}

function windowKey(opts: OpenOptions): string {
  return `${opts.userId ?? ''}|${opts.supplierId ?? ''}`
}

function startClosePoll(): void {
  if (closePollTimer || typeof window === 'undefined') return
  closePollTimer = setInterval(() => {
    if (openedWindows.size === 0) {
      stopClosePoll()
      return
    }
    for (const [key, win] of openedWindows) {
      if (win.closed) {
        openedWindows.delete(key)
        emit('window:close', { key })
        log('window closed', key)
      }
    }
  }, CLOSE_POLL_INTERVAL_MS)
}

function stopClosePoll(): void {
  if (closePollTimer) {
    clearInterval(closePollTimer)
    closePollTimer = null
  }
}

function openWindowSmart(key: string, url: string, features?: string): Window | null {
  if (typeof window === 'undefined') return null
  const existing = openedWindows.get(key)
  if (existing && !existing.closed) {
    try {
      existing.focus()
    } catch {
      openedWindows.delete(key)
    }
    if (openedWindows.has(key)) {
      try {
        if (existing.location.href !== url) existing.location.href = url
      } catch {
        // 跨域不可读/写 location，已 focus 就算成功
      }
      log('reusing existing window', key)
      emit('window:focus', { key, url })
      return existing
    }
  }
  const win = window.open(url, '_blank', features || DEFAULT_FEATURES)
  if (win) {
    openedWindows.set(key, win)
    startClosePoll()
    emit('window:open', { key, url })
  } else {
    emit('error', { source: 'window.open', error: new Error('window.open returned null (popup blocked?)') })
  }
  return win
}

/** 主入口：可选预投商品卡 → 打开客服窗口。预投失败不阻塞开窗。 */
export async function open(opts: OpenOptions): Promise<void> {
  const cfg = ensureBooted()
  const key = windowKey(opts)

  if (opts.card) {
    try {
      await preSendProductCard(cfg.apiBase, opts, opts.card, cfg.debug)
    } catch (e) {
      warn('pre-send product card failed, opening window anyway:', e)
    }
  }
  openWindowSmart(key, buildUrl(cfg, opts), opts.windowFeatures)
}

/** 兜底：跳过预投，直接打开窗口（仍复用已有窗口）。 */
export function openSafe(opts: OpenOptions): void {
  const cfg = ensureBooted()
  const key = windowKey(opts)
  openWindowSmart(key, buildUrl(cfg, opts), opts.windowFeatures)
}

/** 关闭并释放指定用户×客服的窗口缓存（便于宿主手动控制） */
export function close(opts: Pick<OpenOptions, 'userId' | 'supplierId'>): void {
  const key = windowKey(opts as OpenOptions)
  const win = openedWindows.get(key)
  if (win && !win.closed) {
    try { win.close() } catch { /* ignore */ }
  }
  if (openedWindows.delete(key)) {
    emit('window:close', { key })
  }
  if (openedWindows.size === 0) stopClosePoll()
}

/**
 * 按需获取已打开客服窗口的 Window 句柄（用户×客服 key）。
 * 未开 / 已被关闭 / 跨域导致无法访问 → 返回 null。
 *
 * 注意：事件 payload 不再包含 Window 对象（payload 必须可序列化，便于埋点上报）。
 * 如果宿主想要直接操作 Window（如 postMessage / focus），请使用此方法按需取。
 */
export function getOpenWindow(
  opts: Pick<OpenOptions, 'userId' | 'supplierId'>,
): Window | null {
  const key = windowKey(opts as OpenOptions)
  const win = openedWindows.get(key)
  if (win && !win.closed) return win
  return null
}

export { readyPromise as ready, isReadyNow }
export const __version__ = VERSION
