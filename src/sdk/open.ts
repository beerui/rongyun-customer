import type { DajiCSBootOptions, OpenOptions } from './types'
import { buildQuery } from './query'
import { preSendProductCard } from './pre-send'

const DEFAULT_FEATURES = 'width=1000,height=600,scrollbars=yes,resizable=yes'

let config: DajiCSBootOptions | null = null
const VERSION = '0.1.0'

export function boot(options: DajiCSBootOptions): void {
  if (!options?.baseUrl) throw new Error('DajiCS.boot: baseUrl required')
  if (!options?.apiBase) throw new Error('DajiCS.boot: apiBase required')
  config = { ...options, version: options.version ?? VERSION }
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

function openWindow(url: string, features?: string): void {
  if (typeof window === 'undefined') return
  window.open(url, '_blank', features || DEFAULT_FEATURES)
}

/** 主入口：可选预投商品卡 → 打开客服窗口。预投失败不阻塞开窗。 */
export async function open(opts: OpenOptions): Promise<void> {
  const cfg = ensureBooted()
  if (opts.card) {
    try {
      await preSendProductCard(cfg.apiBase, opts, opts.card)
    } catch (e) {
      console.warn('[DajiCS] pre-send product card failed, opening window anyway:', e)
    }
  }
  openWindow(buildUrl(cfg, opts), opts.windowFeatures)
}

/** 兜底：跳过预投，直接打开窗口。 */
export function openSafe(opts: OpenOptions): void {
  const cfg = ensureBooted()
  openWindow(buildUrl(cfg, opts), opts.windowFeatures)
}

export const __version__ = VERSION
