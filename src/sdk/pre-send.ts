import type { OpenOptions, ProductCard } from './types'

/**
 * 预投商品卡：走后端 /sendRyMessage 服务端代发融云消息。
 * 失败抛错，由调用方决定是否阻塞打开窗口。
 */
export async function preSendProductCard(
  apiBase: string,
  opts: OpenOptions,
  card: ProductCard,
): Promise<void> {
  const payload = {
    sendUserId: String(opts.userId ?? ''),
    sendUserNickname: String(opts.userName ?? ''),
    targetUserId: String(opts.supplierId ?? ''),
    objectName: 'DAJI:ProductCard',
    content: JSON.stringify({
      customType: 'product',
      data: {
        title: card.title,
        imgUrl: card.imgUrl,
        spuId: card.spuId ?? '',
        intr: card.intr ?? '',
        notes: card.notes ?? '',
        jumpUrl: card.jumpUrl ?? '',
      },
    }),
    chatType: 1,
    messageType: 100,
    from: 'sdk',
  }

  const url = apiBase.replace(/\/$/, '') + '/sendRyMessage'
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.token) headers.Authorization = String(opts.token)

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`sendRyMessage ${res.status}`)
  const body = await res.json().catch(() => null)
  const code = body?.code
  if (code !== undefined && code !== 0 && code !== 200 && code !== '0' && code !== '200') {
    throw new Error(body?.message || body?.msg || `sendRyMessage code=${code}`)
  }
}
