import * as RC from '@rongcloud/imlib-next'
import type { Message, Conversation, ConversationKind } from './types'
import { parseRcMessage, parseRcConversation } from './parse'

let currentKind: ConversationKind = 'private'

export function setConversationKind(kind: ConversationKind) {
  currentKind = kind
}
export function getConversationKind(): ConversationKind {
  return currentKind
}

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
  if (res.code !== 0) throw new Error(`history failed: ${res.code}`)
  const list: any[] = (res as any).data?.list ?? []
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

/** 发送自定义卡片消息（商品/订单/优惠券），通过 content.customType 区分 */
export async function sendCustomCard(
  targetId: string,
  customType: 'product' | 'order' | 'coupon',
  data: Record<string, any>,
): Promise<Message> {
  const payload = { customType, data, content: JSON.stringify(data) }
  // 融云未内建这些类型；用 TextMessage 承载一段 JSON，靠 content.customType 由前端解析渲染
  const message = new (RC as any).TextMessage(payload)
  const res = await RC.sendMessage({ conversationType: rcType(), targetId }, message)
  if (res.code !== 0) throw new Error(`send custom card failed: ${res.code}`)
  return parseRcMessage(res.data)
}

export async function getConversationList(): Promise<Conversation[]> {
  const res = await RC.getConversationList({ count: 200, startTime: 0, order: 0 })
  if (res.code !== 0) throw new Error(`conv list failed: ${res.code}`)
  const list: any[] = (res as any).data ?? []
  return list
    .filter((c) => c?.conversationType === rcType())
    .map(parseRcConversation)
}
