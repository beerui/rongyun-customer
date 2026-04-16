import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  initIM, connectIM, disconnectIM,
  onMessage, onConnectionStatus,
  getHistory, sendText, sendImage, clearUnread,
  type Message, type ConnectionStatus,
} from '@/im'

const APPKEY = import.meta.env.VITE_RC_APPKEY

export const useImStore = defineStore('im', () => {
  const status = ref<ConnectionStatus>('disconnected')
  const currentTargetId = ref('')
  const messages = ref<Message[]>([])
  /** 失败消息保留在 messages 中 status='failed'，此处仅记录发送中映射供重发定位 */
  const unsubs: Array<() => void> = []

  const connected = computed(() => status.value === 'connected')

  async function connect(token: string) {
    initIM(APPKEY)
    status.value = 'connecting'
    try {
      await connectIM(token)
      status.value = 'connected'
      bindEvents()
    } catch (e) {
      status.value = 'error'
      throw e
    }
  }

  function bindEvents() {
    unbindEvents()
    unsubs.push(
      onConnectionStatus((s) => { status.value = s }),
      onMessage((msg) => {
        if (msg.targetId !== currentTargetId.value) return
        messages.value.push(msg)
        clearUnread(msg.targetId).catch(() => {})
      }),
    )
  }

  function unbindEvents() {
    while (unsubs.length) unsubs.pop()!()
  }

  async function openConversation(targetId: string) {
    currentTargetId.value = targetId
    messages.value = []
    try {
      const history = await getHistory(targetId, { count: 50 })
      messages.value = history.sort((a, b) => a.sentTime - b.sentTime)
      await clearUnread(targetId).catch(() => {})
    } catch (e) {
      console.error('load history failed', e)
    }
  }

  async function sendTextMessage(text: string) {
    const targetId = currentTargetId.value
    if (!targetId || !text.trim()) return
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const optimistic: Message = {
      id: tempId,
      targetId,
      senderId: 'me',
      type: 'text',
      content: text,
      sentTime: Date.now(),
      status: 'sending',
    }
    messages.value.push(optimistic)
    try {
      const real = await sendText(targetId, text)
      const i = messages.value.findIndex((m) => m.id === tempId)
      if (i > -1) messages.value[i] = { ...real, senderId: real.senderId || 'me' }
    } catch {
      const i = messages.value.findIndex((m) => m.id === tempId)
      if (i > -1) messages.value[i] = { ...optimistic, status: 'failed' }
    }
  }

  async function sendImageMessage(url: string) {
    const targetId = currentTargetId.value
    if (!targetId) return
    const tempId = `tmp_${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      targetId,
      senderId: 'me',
      type: 'image',
      content: { url },
      sentTime: Date.now(),
      status: 'sending',
    }
    messages.value.push(optimistic)
    try {
      const real = await sendImage(targetId, url)
      const i = messages.value.findIndex((m) => m.id === tempId)
      if (i > -1) messages.value[i] = real
    } catch {
      const i = messages.value.findIndex((m) => m.id === tempId)
      if (i > -1) messages.value[i] = { ...optimistic, status: 'failed' }
    }
  }

  function disconnect() {
    unbindEvents()
    disconnectIM()
    status.value = 'disconnected'
    messages.value = []
    currentTargetId.value = ''
  }

  return {
    status, connected, currentTargetId, messages,
    connect, disconnect, openConversation,
    sendTextMessage, sendImageMessage,
  }
})
