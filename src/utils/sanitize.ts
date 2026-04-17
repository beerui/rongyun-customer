/**
 * URL scheme 白名单守卫：防止 javascript: / data: 等危险协议注入
 * 用于所有来自消息内容（图片/视频/文件/商品卡等）的 href/src
 */
const SAFE_URL_SCHEMES = ['http:', 'https:', 'blob:', 'mailto:', 'tel:']

export function safeUrl(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) return '#'
  const trimmed = raw.trim()
  if (trimmed.startsWith('//') || trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed
  }
  if (trimmed.startsWith('data:image/')) return trimmed
  try {
    const u = new URL(trimmed, location.origin)
    return SAFE_URL_SCHEMES.includes(u.protocol) ? trimmed : '#'
  } catch {
    return '#'
  }
}
