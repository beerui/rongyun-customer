import type { OpenOptions, ProductCard } from './types'
import { fetchWithRetry } from './utils/fetch-with-retry'

const PRE_SEND_TIMEOUT_MS = 6000
const PRE_SEND_MAX_RETRIES = 2

/**
 * 生成 clientMsgId 用于幂等预投。
 *
 * ★ 这是一个需要你决策的函数。三种策略权衡如下：
 *
 * ── 策略 1：纯 UUID v4（默认实现，最简单） ──────────────────────
 *   每次调用都返回不同 id
 *   ✓ 防：网络抖动导致的自动重试重复落库（服务端看到同 id 直接丢第二条）
 *   ✗ 不防：用户手动点「打开客服」3 次 → 3 条商品卡（id 都不同）
 *
 * ── 策略 2：用户 × 商品 × 时间窗口（推荐） ───────────────────────
 *   `${userId}_${supplierId}_${spuId}_${floor(Date.now()/30000)}`
 *   ✓ 防：同一用户 30 秒内重复预投同一商品（含手动重复点击、SPA 路由切换触发的二次 open()）
 *   ✓ 服务端配合 Redis `SETNX clientMsgId EX 60` 可彻底去重
 *   ✗ 用户确实想在 30 秒内连发两次同款卡会被吞（业务极少见）
 *
 * ── 策略 3：参数内容 hash（最强幂等） ────────────────────────────
 *   sha256(userId + supplierId + spuId + title) 截前 16 字符
 *   ✓ 完全相同的参数永远同一个 id，跨会话跨设备都幂等
 *   ✗ 没有时间维度，用户"永远"无法再次发同款卡（需手动改参数）
 *
 * 当前仓库场景（宿主 seo-daji-web 点"咨询"按钮 → 预投商品卡 → 新开客服 tab）：
 * - 用户不会刻意多次预投同商品
 * - 但按钮防抖不完善 / SPA 路由来回切换会触发多次 open()
 * - 推荐：策略 2（30 秒时间窗口）
 *
 * TODO[你来决策]：默认给的是策略 1（UUID），请根据业务换成策略 2 或 3。
 */
function generateClientMsgId(_opts: OpenOptions, _card: ProductCard): string {
  // 默认：策略 1 - UUID v4
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'cs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10)
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

  return { clientMsgId }
}
