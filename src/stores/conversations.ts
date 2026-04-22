import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type Conversation, getConversationList, onConversationChange } from '@/im'
import { conversationsLogger } from '@/utils/logger'

export const useConversationsStore = defineStore('conversations', () => {
  const list = ref<Conversation[]>([])
  const loading = ref(false)
  let unsub: (() => void) | null = null

  async function load() {
    loading.value = true
    try {
      list.value = await getConversationList()
      conversationsLogger.info('对话列表加载完成', list.value.length)
      list.value.sort((a, b) => (b.lastTime ?? 0) - (a.lastTime ?? 0))
    } catch (error) {
      conversationsLogger.error('对话列表加载失败', error)
      throw error
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

  return { list, loading, load, watch, unwatch }
})
