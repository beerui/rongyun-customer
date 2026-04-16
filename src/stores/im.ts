import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  initIM, connectIM, disconnectIM,
  onMessage, onConnectionStatus,
  getHistory, sendText, sendImage, sendVideo, sendFile, sendCustomCard, clearUnread,
  type Message, type ConnectionStatus,
} from '@/im'
import { uploadImage, uploadVideo, uploadFile as upFile } from '@/utils/upload'

const APPKEY = import.meta.env.VITE_RC_APPKEY

export const useImStore = defineStore('im', () => {
  const status = ref<ConnectionStatus>('disconnected')
  const currentTargetId = ref('')
  const messages = ref<Message[]>([])
  const unsubs: Array<() => void> = []

  const connected = computed(() => status.value === 'connected')
  const isMock = computed(() => status.value === 'connected' && messages.value && currentTargetId.value.startsWith('mock') === false)

  async function connect(token: string) {
    if (token.startsWith('mock-')) {
      status.value = 'connected'
      return
    }
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
      // mock 会话无历史，静默
      console.warn('load history unavailable', e)
    }
  }

  function pushOptimistic(m: Partial<Message> & Pick<Message, 'type' | 'content'>): string {
    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const msg: Message = {
      id: tempId,
      targetId: currentTargetId.value,
      senderId: 'me',
      sentTime: Date.now(),
      status: 'sending',
      ...m,
    } as Message
    messages.value.push(msg)
    return tempId
  }

  function replace(tempId: string, updater: (orig: Message) => Message) {
    const i = messages.value.findIndex((m) => m.id === tempId)
    if (i > -1) messages.value[i] = updater(messages.value[i])
  }

  function markFailed(tempId: string) {
    replace(tempId, (m) => ({ ...m, status: 'failed' }))
  }

  async function sendTextMessage(text: string) {
    const targetId = currentTargetId.value
    if (!targetId || !text.trim()) return
    const tempId = pushOptimistic({ type: 'text', content: text })
    try {
      const real = await sendText(targetId, text)
      replace(tempId, () => ({ ...real, senderId: real.senderId || 'me' }))
    } catch {
      markFailed(tempId)
    }
  }

  async function sendImageFile(file: File) {
    const targetId = currentTargetId.value
    if (!targetId) return
    const preview = URL.createObjectURL(file)
    const tempId = pushOptimistic({ type: 'image', content: { url: preview } })
    try {
      const up = await uploadImage(file)
      const real = await sendImage(targetId, up.url, { width: up.width, height: up.height })
      replace(tempId, () => ({ ...real, senderId: real.senderId || 'me' }))
    } catch (e) {
      console.error('send image failed', e)
      markFailed(tempId)
    }
  }

  async function sendVideoFile(file: File) {
    const targetId = currentTargetId.value
    if (!targetId) return
    const preview = URL.createObjectURL(file)
    const tempId = pushOptimistic({
      type: 'video',
      content: { url: preview, name: file.name, size: file.size },
    })
    try {
      const up = await uploadVideo(file)
      const real = await sendVideo(targetId, up.url, {
        name: up.name || file.name,
        size: up.size || file.size,
        duration: up.duration,
      })
      replace(tempId, () => ({ ...real, senderId: real.senderId || 'me' }))
    } catch (e) {
      console.error('send video failed', e)
      markFailed(tempId)
    }
  }

  async function sendFileMessage(file: File) {
    const targetId = currentTargetId.value
    if (!targetId) return
    const tempId = pushOptimistic({
      type: 'file',
      content: { url: '', name: file.name, size: file.size },
    })
    try {
      const up = await upFile(file)
      const real = await sendFile(targetId, up.url, {
        name: up.name || file.name,
        size: up.size || file.size,
        type: file.type,
      })
      replace(tempId, () => ({ ...real, senderId: real.senderId || 'me' }))
    } catch (e) {
      console.error('send file failed', e)
      markFailed(tempId)
    }
  }

  async function sendCard(customType: 'product' | 'order' | 'coupon', data: Record<string, any>) {
    const targetId = currentTargetId.value
    if (!targetId) return
    const tempId = pushOptimistic({ type: customType as any, content: data })
    try {
      const real = await sendCustomCard(targetId, customType, data)
      replace(tempId, () => ({ ...real, senderId: real.senderId || 'me' }))
    } catch (e) {
      console.warn('send card failed, keeping local preview', e)
      // 即使 SDK 发送失败，仍保留本地渲染（方便未连接时预览卡片效果）
      replace(tempId, (m) => ({ ...m, status: 'sent' }))
    }
  }

  async function retry(messageId: string) {
    const m = messages.value.find((x) => x.id === messageId)
    if (!m || m.status !== 'failed') return
    messages.value = messages.value.filter((x) => x.id !== messageId)
    if (m.type === 'text') return sendTextMessage(String(m.content))
    // 图片/视频/文件重发需要原始 file，此处简单提示用户重新选择
    console.warn('retry for non-text messages requires re-picking the file')
  }

  function disconnect() {
    unbindEvents()
    disconnectIM()
    status.value = 'disconnected'
    messages.value = []
    currentTargetId.value = ''
  }

  return {
    status, connected, currentTargetId, messages, isMock,
    connect, disconnect, openConversation,
    sendTextMessage, sendImageFile, sendVideoFile, sendFileMessage, sendCard, retry,
    sendImageMessage: (url: string) => sendTextMessage(url),
  }
})
