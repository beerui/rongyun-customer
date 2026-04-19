import type { OpenOptions, ProductCard } from './types'
import { fetchWithRetry } from './utils/fetch-with-retry'
import { emit } from './events'

const PRE_SEND_TIMEOUT_MS = 6000
const PRE_SEND_MAX_RETRIES = 2

/**
 * 生成 clientMsgId 用于幂等预投。
 *
 * 当前策略：用户 × 客服 × 商品 × 30 秒时间窗口。
 * `cs_${userId}_${supplierId}_${spuId}_${floor(Date.now()/30000)}`
 *
 * 含义：同一用户在 30 秒内重复预投同一商品卡到同一客服，clientMsgId 一致。
 * 服务端配合 `SETNX clientMsgId EX 60`（或 DB 唯一索引）即可去重：
 *   - 网络抖动自动重试 → 同 id → 只落库一条
 *   - 用户手动点击 3 次"咨询" → 同 id → 只落库一条
 *   - SPA 路由切换触发二次 open() → 同 id → 只落库一条
 *
 * 若业务需要"30 秒内确实可以连发两张同款卡"，可替换为：
 *   - UUID v4（`crypto.randomUUID()`）— 最弱幂等，仅防网络重试
 *   - 内容 hash（sha256 截断）— 最强幂等，但永不允许再发同款
 */
function generateClientMsgId(opts: OpenOptions, card: ProductCard): string {
  const userId = String(opts.userId ?? 'anon')
  const supplierId = String(opts.supplierId ?? '')
  const spuId = String(card.spuId ?? '')
  const window30s = Math.floor(Date.now() / 30000)
  return `cs_${userId}_${supplierId}_${spuId}_${window30s}`
}

/**
 * 预投商品卡：走后端 /sendRyMessage 服务端代发融云消息。
 * 失败抛错，由调用方决定是否阻塞打开窗口。
 *
 * 内置超时 6s / 最多重试 2 次（5xx / 429 / 408 / 网络错误）/ clientMsgId 幂等。
 */
export async function preSendProductCard(
  apiBase: string,
  opts: OpenOptions,
  card: ProductCard,
  debug = false,
): Promise<{ clientMsgId: string }> {
  const clientMsgId = generateClientMsgId(opts, card)
  emit('presend:start', { clientMsgId, card, opts })

  const payload = {
    clientMsgId,
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

  try {
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      credentials: 'include',
      timeout: PRE_SEND_TIMEOUT_MS,
      maxRetries: PRE_SEND_MAX_RETRIES,
      debug,
    })

    const body = await res.json().catch(() => null)
    const code = body?.code
    if (code !== undefined && code !== 0 && code !== 200 && code !== '0' && code !== '200') {
      throw new Error(body?.message || body?.msg || `sendRyMessage code=${code}`)
    }
    emit('presend:success', { clientMsgId })
    return { clientMsgId }
  } catch (error) {
    emit('presend:error', { clientMsgId, error })
    throw error
  }
}
