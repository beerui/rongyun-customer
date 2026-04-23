import * as RC from '@rongcloud/imlib-next'
import { HISTORY_PAGE_SIZE } from '@/constants/pagination'
import { buildDajiCardMessage } from './custom-messages'
import { parseRcConversation, parseRcMessage } from './parse'
import type { Conversation, ConversationKind, Message } from './types'

let currentKind: ConversationKind = 'private'

function rcType() {
  return currentKind === 'group' ? RC.ConversationType.GROUP : RC.ConversationType.PRIVATE
}

export async function getHistory(
  targetId: string,
  opts: { timestamp?: number; count?: number } = {},
): Promise<Message[]> {
  const res = await RC.getHistoryMessages(
    { conversationType: rcType(), targetId },
    { timestamp: opts.timestamp ?? 0, count: opts.count ?? 50, order: 0 },
  )
  if (res.code !== RC.ErrorCode.SUCCESS) throw new Error(`history failed: ${res.code}`)
  const list = res.data?.list ?? []
  return list.map(parseRcMessage)
}

export async function sendText(targetId: string, text: string): Promise<Message> {
  const message = new (RC as any).TextMessage({ content: text })
  const res = await RC.sendMessage({ conversationType: rcType(), targetId }, message)
  if (res.code !== 0) throw new Error(`send failed: ${res.code}`)
  return parseRcMessage(res.data)
}

export async function sendImage(
  targetId: string,
  imageUrl: string,
  meta: { width?: number; height?: number } = {},
): Promise<Message> {
  const message = new (RC as any).ImageMessage({
    imageUri: imageUrl,
    content: imageUrl,
    ...meta,
  })
  const res = await RC.sendMessage({ conversationType: rcType(), targetId }, message)
  if (res.code !== 0) throw new Error(`send image failed: ${res.code}`)
  return parseRcMessage(res.data)
}

export async function sendVideo(
  targetId: string,
  videoUrl: string,
  meta: { name?: string; size?: number; duration?: number } = {},
): Promise<Message> {
  // 融云 SightMessage = 小视频
  const message = new (RC as any).SightMessage({
    sightUrl: videoUrl,
    content: videoUrl,
    name: meta.name,
    size: meta.size,
    duration: meta.duration,
  })
  const res = await RC.sendMessage({ conversationType: rcType(), targetId }, message)
  if (res.code !== 0) throw new Error(`send video failed: ${res.code}`)
  return parseRcMessage(res.data)
}

export async function sendFile(
  targetId: string,
  fileUrl: string,
  meta: { name: string; size: number; type?: string } = { name: '', size: 0 },
): Promise<Message> {
  const message = new (RC as any).FileMessage({
    fileUrl,
    name: meta.name,
    size: meta.size,
    type: meta.type,
  })
  const res = await RC.sendMessage({ conversationType: rcType(), targetId }, message)
  if (res.code !== 0) throw new Error(`send file failed: ${res.code}`)
  return parseRcMessage(res.data)
}

export async function clearUnread(targetId: string): Promise<void> {
  await RC.clearMessagesUnreadStatus({ conversationType: rcType(), targetId })
}

/** 撤回消息（融云原生）：2 分钟限制由调用方把关 */
export async function recallMessage(raw: any): Promise<void> {
  const res = await (RC as any).recallMessage(raw)
  if (res?.code !== 0 && res?.code != null) throw new Error(`recall failed: ${res.code}`)
}

/** 发送自定义卡片消息（商品 / 订单 / 优惠券），走 `DAJI:Card` 自定义消息类型 */
export async function sendCustomCard(
  targetId: string,
  customType: 'product' | 'order' | 'coupon',
  data: Record<string, any>,
): Promise<Message> {
  const message = buildDajiCardMessage({ customType, data })
  const res = await RC.sendMessage({ conversationType: rcType(), targetId }, message)
  if (res.code !== 0) throw new Error(`send custom card failed: ${res.code}`)
  return parseRcMessage(res.data)
}

export async function getConversationList(): Promise<Conversation[]> {
  // getConversationList 替换为 getConversationListByTimestamp 多端同步时可能出现的顺序错乱问题
  const params = {
    // 获取会话的时间戳。
    // 传 0 代表从最新（当前时间）开始获取。
    // 分页时，传入上一页最后一条会话的 sentTime。
    startTime: 0,

    // 获取的会话数量，单次建议不超过 50，最大支持 200。
    count: HISTORY_PAGE_SIZE,

    // 拉取顺序。
    // 0: 降序（获取 startTime 之前的会话，即更旧的）。
    // 1: 升序（获取 startTime 之后的会话，即更新的）。
    order: 0,
  } as RC.IGetConversationListByTimestampParams
  const res = await RC.getConversationListByTimestamp(params)
  console.log('res', res)
  if (res.code !== RC.ErrorCode.SUCCESS) throw new Error(`conv list failed: ${res.code}`)
  const list = res.data ?? []
  return list.filter((c) => c?.conversationType === rcType()).map(parseRcConversation)
}
