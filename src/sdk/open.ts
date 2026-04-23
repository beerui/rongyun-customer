import { clearAllListeners, emit } from './events'
import { startBridge } from './launcher/bridge'
import { triggerReset } from './lifecycle'
import { preSendProductCard } from './pre-send'
import { buildQuery } from './query'
import { isReadyNow, ready as readyPromise, resetReady, signalReady } from './ready'
import type { DajiCSBootOptions, OpenOptions } from './types'

const VERSION = '0.1.0'
const WINDOW_NAME = 'DJ_Chat_Window'

let config: DajiCSBootOptions | null = null

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
    const changed = config.baseUrl !== options.baseUrl || config.apiBase !== options.apiBase
    if (changed) {
      warn('boot() called again with different config — ignoring. Call DajiCS.reset() first to re-boot.')
      return
    }
    log('boot() called again with identical config — no-op.')
    return
  }
  config = { ...options, version: options.version ?? VERSION }
  log('booted', config)
  startBridge(config.baseUrl, config.allowedOrigins, {
    autoClose: config.autoCloseOnEnd,
    closeDelay: config.endCloseDelay,
  })
  signalReady()
  emit('ready', undefined)
}

/**
 * 重置 SDK 内部状态：config / ready。
 *
 * 默认**不清除用户事件订阅**（职责分离：listeners 由订阅方自己管理）。
 * 如需彻底清零（如 SPA 卸载 SDK 时），传 `{ clearListeners: true }`。
 */
export function reset(options?: { clearListeners?: boolean }): void {
  config = null
  resetReady()
  triggerReset()
  if (options?.clearListeners) clearAllListeners()
}

function ensureBooted(): DajiCSBootOptions {
  if (!config) throw new Error('DajiCS: call boot() before open()')
  return config
}

/** tab 模式：直接打开 /buyer/:supplierId，query 携带身份信息 */
function buildTabUrl(cfg: DajiCSBootOptions, opts: OpenOptions): string {
  const root = cfg.baseUrl.replace(/\/$/, '')
  const supplierId = opts.supplierId ?? 'default'
  const qs = buildQuery(opts, cfg.version ?? VERSION)
  return `${root}/buyer/${encodeURIComponent(supplierId)}${qs ? '?' + qs : ''}`
}

/** iframe 模式：通过 /chat 入口，由 ChatEntry.vue 解析 query 后跳转 */
function buildIframeUrl(cfg: DajiCSBootOptions, opts: OpenOptions): string {
  const root = cfg.baseUrl.replace(/\/$/, '')
  const qs = buildQuery(opts, cfg.version ?? VERSION)
  return `${root}/chat${qs ? '?' + qs : ''}`
}

/** 公共：根据当前 boot 配置构造 /chat URL（供 launcher iframe 模式使用） */
export function buildChatUrl(opts: OpenOptions): string {
  return buildIframeUrl(ensureBooted(), opts)
}

/** 打开客服标签页（浏览器自动复用同名窗口） */
function openTab(url: string): Window | null {
  if (typeof window === 'undefined') return null
  const win = window.open(url, WINDOW_NAME)
  if (!win) {
    emit('error', { source: 'window.open', error: new Error('window.open returned null (popup blocked?)') })
  }
  return win
}

/** 主入口：可选预投商品卡 → 打开客服标签页。预投失败不阻塞开窗。 */
export async function open(opts: OpenOptions): Promise<void> {
  const cfg = ensureBooted()

  if (opts.card) {
    try {
      await preSendProductCard(cfg.apiBase, opts, opts.card, cfg.debug)
    } catch (e) {
      warn('pre-send product card failed, opening window anyway:', e)
    }
  }
  const url = buildTabUrl(cfg, opts)
  const win = openTab(url)
  if (win) {
    log('opened tab:', url)
    emit('window:open', { key: WINDOW_NAME, url })
  }
}

/** 兜底：跳过预投，直接打开标签页。 */
export function openSafe(opts: OpenOptions): void {
  const cfg = ensureBooted()
  const url = buildTabUrl(cfg, opts)
  const win = openTab(url)
  if (win) {
    log('opened tab (safe):', url)
    emit('window:open', { key: WINDOW_NAME, url })
  }
}

export { readyPromise as ready, isReadyNow }
export const version = VERSION
