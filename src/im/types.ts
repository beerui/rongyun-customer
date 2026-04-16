export type MessageType = 'text' | 'image' | 'file' | 'custom'

export type ImagePayload = { url: string; width?: number; height?: number }
export type FilePayload = { url: string; name: string; size: number }
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
  raw?: unknown
}

export interface Conversation {
  targetId: string
  title: string
  avatar?: string
  lastMessage?: string
  lastTime?: number
  unread: number
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
