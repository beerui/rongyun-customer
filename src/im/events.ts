import * as RC from '@rongcloud/imlib-next'
import { parseRcConversation, parseRcMessage } from './parse'
import type { ConnectionStatus, Conversation, Message } from './types'

type Unsub = () => void

export function onMessage(handler: (msg: Message) => void): Unsub {
  const fn = (evt: any) => {
    console.log('onMessage', evt)
    const list: any[] = evt?.messages ?? []
    list.forEach((m) => handler(parseRcMessage(m)))
  }
  RC.addEventListener(RC.Events.MESSAGES, fn as any)
  return () => RC.removeEventListener(RC.Events.MESSAGES, fn as any)
}

export function onConversationChange(handler: (list: Conversation[]) => void): Unsub {
  const fn = (evt: any) => {
    console.log('onConversationChange', evt)
    const list: any[] = evt?.conversationList ?? []
    handler(list.map(parseRcConversation))
  }
  RC.addEventListener(RC.Events.CONVERSATION, fn as any)
  return () => RC.removeEventListener(RC.Events.CONVERSATION, fn as any)
}

export function onConnectionStatus(handler: (s: ConnectionStatus) => void): Unsub {
  const fn = (evt: any) => {
    console.log('onConnectionStatus', evt)
    const code = evt?.status
    const map: Record<number, ConnectionStatus> = {
      0: 'connected',
      1: 'connecting',
      2: 'disconnected',
    }
    handler(map[code] ?? 'error')
  }
  RC.addEventListener(RC.Events.CONNECTING, fn as any)
  RC.addEventListener(RC.Events.CONNECTED, fn as any)
  RC.addEventListener(RC.Events.DISCONNECT, fn as any)
  return () => {
    RC.removeEventListener(RC.Events.CONNECTING, fn as any)
    RC.removeEventListener(RC.Events.CONNECTED, fn as any)
    RC.removeEventListener(RC.Events.DISCONNECT, fn as any)
  }
}
