import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { isEmbedded, sendToParent } from '@/utils/embed-bridge'
import { bindVisibilityReset, browserNotify, flashTitle, playBeep } from '@/utils/notify'
import { uploadFile as upFile, uploadImage, uploadVideo } from '@/utils/upload'
import {
  type ConnectionStatus,
  type Message,
  clearUnread,
  connectIM,
  disconnectIM,
  getHistory,
  initIM,
  onConnectionStatus,
  onMessage,
  recallMessage,
  sendCustomCard,
  sendFile,
  sendImage,
  sendText,
  sendVideo,
} from '@/im'

const APPKEY = import.meta.env.VITE_RC_APPKEY

export const useImStore = defineStore('im', () => {
  const status = ref<ConnectionStatus>('disconnected')
  const currentTargetId = ref('')
  const messages = ref<Message[]>([])
  const unreadTotal = ref(0)
  const unsubs: Array<() => void> = []
  const loadingHistory = ref(false)
  const hasMoreHistory = ref(true)
  const oldestTimestamp = ref(0)
  bindVisibilityReset()

  const connected = computed(() => status.value === 'connected')
  const isMock = computed(
    () => status.value === 'connected' && messages.value && currentTargetId.value.startsWith('mock') === false,
  )

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
      onConnectionStatus((s) => {
        status.value = s
      }),
      onMessage((msg) => {
        // 撤回通知：定位原消息打标记；找不到则作为占位插入
        if (msg.recalled && msg.raw) {
          const targetUId = String((msg.raw as any)._recallTargetUId || '')
          if (targetUId) {
            const existing = messages.value.find((m) => m.id === targetUId)
            if (existing) {
              replace(targetUId, (orig) => ({ ...orig, recalled: true }))
              return
            }
          }
          // 落不到原消息：可能是历史加载前到达的 RcNtf；直接插占位
          if (msg.targetId === currentTargetId.value) messages.value.push(msg)
          return
        }

        // 会话结束控制消息：不进入消息列表，透传给 SDK 宿主（如有）
        const rawContent = (msg.raw as any)?.content
        if (rawContent?.customType === 'conversation-end') {
          const reason = String(rawContent?.reason ?? 'agent')
          if (isEmbedded()) sendToParent('daji:conversation-end', { reason })
          return
        }

        const fromSelf = msg.senderId === 'me' || (msg.status === 'sent' && messages.value.some((m) => m.id === msg.id))
        const isCurrent = msg.targetId === currentTargetId.value
        const hidden = typeof document !== 'undefined' && document.hidden

        if (!fromSelf && (!isCurrent || hidden)) {
          unreadTotal.value += 1
          playBeep()
          const preview = typeof msg.content === 'string' ? msg.content : `[${msg.type}]`
          browserNotify(msg.senderName || '新消息', preview.slice(0, 60))
          flashTitle(unreadTotal.value)
          // SDK Launcher iframe 模式：把未读数与消息预览推给 parent
          if (isEmbedded()) {
            sendToParent('daji:unread', { count: unreadTotal.value })
            sendToParent('daji:message', {
              from: msg.senderName || '',
              preview: preview.slice(0, 60),
            })
          }
        }

        if (!isCurrent) return
        messages.value.push(msg)
        clearUnread(msg.targetId).catch(() => {})
      }),
    )
  }

  function unbindEvents() {
    while (unsubs.length) unsubs.pop()!()
  }

  async function loadMoreHistory(): Promise<boolean> {
    if (loadingHistory.value || !hasMoreHistory.value || !currentTargetId.value) {
      return false
    }

    loadingHistory.value = true
    try {
      const history = await getHistory(currentTargetId.value, {
        timestamp: oldestTimestamp.value,
        count: 20,
      })

      if (history.length === 0) {
        hasMoreHistory.value = false
        return false
      }

      const sorted = history.sort((a, b) => a.sentTime - b.sentTime)
      messages.value.unshift(...sorted)

      oldestTimestamp.value = sorted[0].sentTime

      return true
    } catch (e) {
      console.warn('load more history failed', e)
      return false
    } finally {
      loadingHistory.value = false
    }
  }

  async function openConversation(targetId: string) {
    currentTargetId.value = targetId
    messages.value = []
    unreadTotal.value = 0
    if (isEmbedded()) sendToParent('daji:unread', { count: 0 })
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

  /** 撤回自己发送的消息（2 分钟内）；mock 会话或无 raw 时只做本地标记 */
  async function recall(messageId: string) {
    const m = messages.value.find((x) => x.id === messageId)
    if (!m) return
    const within2Min = Date.now() - m.sentTime <= 120_000
    if (!within2Min) throw new Error('消息发送超过 2 分钟，无法撤回')
    try {
      if (m.raw) await recallMessage(m.raw)
    } catch (e) {
      console.warn('RC recall failed, fallback to local mark', e)
    }
    replace(messageId, (orig) => ({ ...orig, recalled: true }))
  }

  function disconnect() {
    unbindEvents()
    disconnectIM()
    status.value = 'disconnected'
    messages.value = []
    currentTargetId.value = ''
  }

  /**
   * 访客主动结束会话：通知 parent（SDK）触发 conversation:end 流程。
   * 非 iframe 场景 no-op（独立 tab / 直接访问 /chat 不适用）。
   */
  function endConversation(reason: 'user' | 'timeout' | 'agent' = 'user') {
    if (isEmbedded()) sendToParent('daji:conversation-end', { reason })
  }

  return {
    status,
    connected,
    currentTargetId,
    messages,
    isMock,
    unreadTotal,
    connect,
    disconnect,
    openConversation,
    loadMoreHistory,
    endConversation,
    sendTextMessage,
    sendImageFile,
    sendVideoFile,
    sendFileMessage,
    sendCard,
    retry,
    recall,
    sendImageMessage: (url: string) => sendTextMessage(url),
    loadingHistory,
    hasMoreHistory,
  }
})
