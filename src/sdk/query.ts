import type { OpenOptions } from './types'

/**
 * 把 OpenOptions 序列化成老方案的 daji_* query string。
 *
 * ⚠️ 安全注意：token 以明文出现在 URL query 中（daji_token=xxx），
 * 会被浏览器历史、Referrer、服务端 access-log 等记录。
 * 生产环境应尽早迁移到 postMessage 下发 token 的方案（C2 阶段）。
 */
export function buildQuery(opts: OpenOptions, sdkVersion: string): string {
  const params: Record<string, string> = {
    daji_userId: String(opts.userId ?? ''),
    daji_userName: String(opts.userName ?? ''),
    daji_userType: String(opts.userType ?? ''),
    daji_language: String(opts.language ?? ''),
    daji_token: String(opts.token ?? ''),
    daji_priceType: String(opts.priceType ?? ''),
    daji_supplierId: String(opts.supplierId ?? ''),
    daji_host: typeof location !== 'undefined' ? location.host : '',
    daji_sdkv: sdkVersion,
  }
  return Object.entries(params)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}
