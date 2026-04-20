export type MessageType = 'text' | 'image' | 'video' | 'file' | 'product' | 'order' | 'coupon' | 'custom'

export type ImagePayload = { url: string; width?: number; height?: number }
export type VideoPayload = { url: string; name?: string; size?: number; duration?: number }
export type FilePayload = { url: string; name: string; size: number }
export type ProductPayload = {
  productId: string
  title: string
  cover: string
  price: number
  originPrice?: number
  spec?: string
  stock?: number
  url?: string
}
export type OrderPayload = {
  orderId: string
  status: string
  items: Array<{ title: string; cover: string; qty: number; price: number }>
  totalAmount: number
  createdAt: string
}
export type CouponPayload = {
  couponId: string
  title: string
  amount: number
  threshold?: number
  expireAt?: string
}
export type CustomPayload = Record<string, unknown>

/** 会话模式：默认私聊，后端群能力就绪后切到 'group' */
export type ConversationKind = 'private' | 'group'

export interface Message {
  id: string
  /** 会话对端 ID：private = 对方 userId；group = groupId */
  targetId: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  type: MessageType
  content: string | ImagePayload | FilePayload | CustomPayload
  sentTime: number
  status: 'sending' | 'sent' | 'failed'
  recalled?: boolean
  raw?: unknown
}

export interface Conversation {
  targetId: string
  title: string
  avatar?: string
  lastMessage?: string
  /** 最后一条消息的发送者 ID；用于客服端筛选"待接入 / 进行中" */
  lastMessageSenderId?: string
  lastTime?: number
  unread: number
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
