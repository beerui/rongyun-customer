import * as RC from '@rongcloud/imlib-next'
import type { Message, Conversation, ConversationKind } from './types'
import { parseRcMessage, parseRcConversation } from './parse'

/**
 * 会话类型运行时可切换：
 *   当前默认 `private`（1v1 独立消息）
 *   后端"一客一群"方案就绪后调用 setConversationKind('group')
 */
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

export async function sendImage(targetId: string, imageUrl: string): Promise<Message> {
  const message = new (RC as any).ImageMessage({ imageUri: imageUrl, content: imageUrl })
  const res = await RC.sendMessage({ conversationType: rcType(), targetId }, message)
  if (res.code !== 0) throw new Error(`send image failed: ${res.code}`)
  return parseRcMessage(res.data)
}

export async function clearUnread(targetId: string): Promise<void> {
  await RC.clearMessagesUnreadStatus({ conversationType: rcType(), targetId })
}

export async function getConversationList(): Promise<Conversation[]> {
  const res = await RC.getConversationList({ count: 200, startTime: 0, order: 0 })
  if (res.code !== 0) throw new Error(`conv list failed: ${res.code}`)
  const list: any[] = (res as any).data ?? []
  return list
    .filter((c) => c?.conversationType === rcType())
    .map(parseRcConversation)
}
