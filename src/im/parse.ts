import type { Message, Conversation, MessageType } from './types'

function detectType(objectName: string): MessageType {
  switch (objectName) {
    case 'RC:TxtMsg': return 'text'
    case 'RC:ImgMsg': return 'image'
    case 'RC:FileMsg': return 'file'
    default: return 'custom'
  }
}

function parseContent(type: MessageType, content: any): any {
  if (type === 'text') return content?.content ?? ''
  if (type === 'image') return { url: content?.imageUri || content?.content || '' }
  if (type === 'file') return {
    url: content?.fileUrl ?? '',
    name: content?.name ?? '',
    size: Number(content?.size ?? 0),
  }
  return content
}

export function parseRcMessage(raw: any): Message {
  const objectName = raw?.messageType || raw?.objectName || 'RC:TxtMsg'
  const type = detectType(objectName)
  const content = raw?.content ?? {}
  return {
    id: String(raw?.messageUId ?? raw?.messageId ?? `${raw?.sentTime ?? Date.now()}_${Math.random()}`),
    targetId: String(raw?.targetId ?? ''),
    senderId: String(raw?.senderUserId ?? raw?.fromUserId ?? ''),
    senderName: content?.user?.name,
    senderAvatar: content?.user?.portrait,
    type,
    content: parseContent(type, content),
    sentTime: Number(raw?.sentTime ?? Date.now()),
    status: 'sent',
    raw,
  }
}

export function parseRcConversation(raw: any): Conversation {
  const conv = raw?.conversation ?? raw
  const last = conv?.latestMessage?.content
  return {
    targetId: String(conv?.targetId ?? ''),
    title: conv?.title || String(conv?.targetId ?? ''),
    avatar: conv?.portraitUrl,
    lastMessage: typeof last?.content === 'string' ? last.content : '[消息]',
    lastTime: Number(conv?.sentTime ?? conv?.latestMessage?.sentTime ?? 0),
    unread: Number(conv?.unreadMessageCount ?? 0),
  }
}
