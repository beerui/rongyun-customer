import { defineStore } from 'pinia'
import { ref } from 'vue'
import { onConversationChange, getConversationList, type Conversation } from '@/im'

export const useConversationsStore = defineStore('conversations', () => {
  const list = ref<Conversation[]>([])
  const loading = ref(false)
  let unsub: (() => void) | null = null

  async function load() {
    loading.value = true
    try {
      list.value = await getConversationList()
      list.value.sort((a, b) => (b.lastTime ?? 0) - (a.lastTime ?? 0))
    } finally {
      loading.value = false
    }
  }

  function watch() {
    unwatch()
    unsub = onConversationChange((items) => {
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
