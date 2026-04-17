import type { Message, Conversation, MessageType } from './types'

const RECALL_CMD = 'RC:RcCmd'
const RECALL_NTF = 'RC:RcNtf'

function detectType(objectName: string, content: any): MessageType {
  switch (objectName) {
    case 'RC:TxtMsg': return 'text'
    case 'RC:ImgMsg': return 'image'
    case 'RC:FileMsg': return 'file'
    case 'RC:SightMsg': return 'video'
  }
  // 自定义消息：通过 content.customType 区分
  const ct = content?.customType
  if (ct === 'product') return 'product'
  if (ct === 'order')   return 'order'
  if (ct === 'coupon')  return 'coupon'
  return 'custom'
}

function parseContent(type: MessageType, content: any): any {
  if (type === 'text') return content?.content ?? ''
  if (type === 'image') return {
    url: content?.imageUri || content?.content || '',
    width: content?.width,
    height: content?.height,
  }
  if (type === 'video') return {
    url: content?.sightUrl || content?.content || '',
    duration: content?.duration,
    name: content?.name,
    size: content?.size,
  }
  if (type === 'file') return {
    url: content?.fileUrl ?? '',
    name: content?.name ?? '',
    size: Number(content?.size ?? 0),
  }
  if (type === 'product' || type === 'order' || type === 'coupon') {
    return content?.data ?? content
  }
  return content
}

export function parseRcMessage(raw: any): Message {
  const objectName = raw?.messageType || raw?.objectName || 'RC:TxtMsg'
  const content = raw?.content ?? {}

  // 撤回：RC:RcCmd（实时撤回命令）或 RC:RcNtf（历史中的撤回通知占位）
  // 两者的 content.messageUId 都指向被撤回的原消息
  const isRecall = objectName === RECALL_CMD || objectName === RECALL_NTF
  if (isRecall) {
    const targetUId = String(content?.messageUId ?? '')
    return {
      id: String(raw?.messageUId ?? raw?.messageId ?? `recall_${targetUId}`),
      targetId: String(raw?.targetId ?? content?.targetId ?? ''),
      senderId: String(raw?.senderUserId ?? raw?.fromUserId ?? ''),
      type: 'text',
      content: '',
      sentTime: Number(raw?.sentTime ?? content?.sentTime ?? Date.now()),
      status: 'sent',
      recalled: true,
      raw: { ...raw, _recallTargetUId: targetUId, _isRecallCmd: objectName === RECALL_CMD },
    }
  }

  const type = detectType(objectName, content)
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
