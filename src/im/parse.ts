import { DAJI_CARD_OBJECT_NAME } from './custom-messages'
import type { Conversation, Message, MessageType } from './types'

const RECALL_CMD = 'RC:RcCmd'
const RECALL_NTF = 'RC:RcNtf'

function detectType(objectName: string, content: any): MessageType {
  // DAJI:Card 自定义卡片消息（客服→访客商品/订单/优惠券）
  if (objectName === DAJI_CARD_OBJECT_NAME) {
    const ct = content?.customType
    if (ct === 'product' || ct === 'order' || ct === 'coupon') return ct
    return 'custom'
  }
  // 控制类消息（如 conversation-end）仍走 TextMessage 携带 customType 的老约定
  const ct = content?.customType
  if (ct === 'conversation-end') return 'custom'
  switch (objectName) {
    case 'RC:TxtMsg':
      return 'text'
    case 'RC:ImgMsg':
      return 'image'
    case 'RC:FileMsg':
      return 'file'
    case 'RC:SightMsg':
      return 'video'
    case 'RC:GrpNtf':
      return 'system'
  }
  return 'custom'
}

function parseContent(type: MessageType, content: any): any {
  if (type === 'text') return content?.content ?? ''
  if (type === 'image')
    return {
      url: content?.imageUri || content?.content || '',
      width: content?.width,
      height: content?.height,
    }
  if (type === 'video')
    return {
      url: content?.sightUrl || content?.content || '',
      duration: content?.duration,
      name: content?.name,
      size: content?.size,
    }
  if (type === 'file')
    return {
      url: content?.fileUrl ?? '',
      name: content?.name ?? '',
      size: Number(content?.size ?? 0),
    }
  if (type === 'system') return content
  if (type === 'product' || type === 'order' || type === 'coupon') {
    // DAJI:Card 消息：content 形状就是 { customType, data }
    if (content?.data) return content.data
    // 兼容老协议：content.content 是一段 JSON 字符串
    if (typeof content?.content === 'string') {
      try {
        return JSON.parse(content.content)
      } catch {
        /* ignore */
      }
    }
    return content
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
  const latest = conv?.latestMessage
  return {
    targetId: String(conv?.targetId ?? ''),
    title: conv?.title || String(conv?.targetId ?? ''),
    avatar: conv?.portraitUrl,
    lastMessage: formatLastMessagePreview(latest),
    lastMessageSenderId: String(latest?.senderUserId ?? conv?.senderUserId ?? ''),
    lastTime: Number(conv?.sentTime ?? latest?.sentTime ?? 0),
    unread: Number(conv?.unreadMessageCount ?? 0),
  }
}

/**
 * 会话列表最后一条消息的预览文案。
 * 非文本消息不展示原始 URL / JSON，统一回落到 `[类型]` 占位；
 * 商品 / 订单 / 优惠券附带标题或编号，信息量更足。
 */
function formatLastMessagePreview(latest: any): string {
  if (!latest) return ''
  const objectName = latest?.messageType || latest?.objectName || ''
  if (objectName === RECALL_CMD || objectName === RECALL_NTF) return '[消息已撤回]'
  const content = latest?.content ?? {}
  const type = detectType(objectName, content)
  switch (type) {
    case 'text': {
      const t = typeof content?.content === 'string' ? content.content : ''
      return t || '[消息]'
    }
    case 'image':
      return '[图片]'
    case 'video':
      return '[视频]'
    case 'file':
      return '[文件]'
    case 'product': {
      const title = content?.data?.title
      return title ? `[商品] ${title}` : '[商品]'
    }
    case 'order': {
      const orderId = content?.data?.orderId
      return orderId ? `[订单] ${orderId}` : '[订单]'
    }
    case 'coupon': {
      const title = content?.data?.title
      return title ? `[优惠券] ${title}` : '[优惠券]'
    }
    default:
      return '[消息]'
  }
}
