import type { OpenOptions } from './types'

/** 把 OpenOptions 序列化成老方案的 daji_* query string */
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
