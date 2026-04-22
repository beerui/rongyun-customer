import { defineStore } from 'pinia'
import { ref } from 'vue'
import { conversationsLogger } from '@/utils/logger'
import { type Conversation, getConversationList, onConversationChange } from '@/im'

export const useConversationsStore = defineStore('conversations', () => {
  const list = ref<Conversation[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)
  let unsub: (() => void) | null = null

  async function load() {
    loading.value = true
    error.value = null
    try {
      list.value = await getConversationList()
      list.value.sort((a, b) => (b.lastTime ?? 0) - (a.lastTime ?? 0))
      conversationsLogger.info('对话列表加载完成', list.value.length)
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      conversationsLogger.error('对话列表加载失败', e)
    } finally {
      loading.value = false
    }
  }

  function watch() {
    unwatch()
    unsub = onConversationChange((items) => {
      conversationsLogger.debug('对话更新', items.length)
      items.forEach((c) => {
        const i = list.value.findIndex((x) => x.targetId === c.targetId)
        if (i > -1) list.value[i] = c
        else list.value.unshift(c)
      })
      list.value.sort((a, b) => (b.lastTime ?? 0) - (a.lastTime ?? 0))
    })
  }

  function unwatch() {
    unsub?.()
    unsub = null
  }

  /** 手动清除指定对话的未读数（用于打开对话后立即更新 UI） */
  function clearUnread(targetId: string) {
    const conv = list.value.find((c) => c.targetId === targetId)
    if (conv) conv.unread = 0
  }

  return { list, loading, error, load, watch, unwatch, clearUnread }
})
