<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useImStore } from '@/stores/im'
import type { Message } from '@/im'
import EmptyState from './EmptyState.vue'
import MessageBubble from './MessageBubble.vue'
import TimeDivider from './TimeDivider.vue'

const props = defineProps<{
  messages: Message[]
  myUserId: string
}>()

const emit = defineEmits<{
  (e: 'retry', id: string): void
  (e: 'recall', id: string): void
}>()

const im = useImStore()
const loading = computed(() => im.loadingHistory)
const hasMore = computed(() => im.hasMoreHistory)

const scroller = ref<HTMLElement>()

async function scrollToBottom() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

function handleScroll() {
  if (!scroller.value || loading.value || !hasMore.value) return
  if (scroller.value.scrollTop < 50) {
    loadMore()
  }
}

async function loadMore() {
  if (!scroller.value) return
  const prevHeight = scroller.value.scrollHeight
  const prevTop = scroller.value.scrollTop
  const success = await im.loadMoreHistory()
  if (success) {
    await nextTick()
    const diff = scroller.value.scrollHeight - prevHeight
    scroller.value.scrollTop = prevTop + diff
  }
}

watch(
  () => props.messages[props.messages.length - 1]?.id,
  (newLastId, prevLastId) => {
    if (newLastId && newLastId !== prevLastId) scrollToBottom()
  },
)

const FIVE_MIN = 5 * 60 * 1000
const items = computed(() => {
  const out: Array<{ kind: 'time'; ts: number; key: string } | { kind: 'msg'; m: Message; key: string }> = []
  let lastTs = 0
  for (const m of props.messages) {
    if (!lastTs || m.sentTime - lastTs > FIVE_MIN) {
      out.push({ kind: 'time', ts: m.sentTime, key: `t_${m.sentTime}` })
    }
    out.push({ kind: 'msg', m, key: m.id })
    lastTs = m.sentTime
  }
  return out
})

onMounted(() => {
  scroller.value?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  scroller.value?.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div ref="scroller" class="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 bg-white">
    <EmptyState v-if="!messages.length" title="还没有消息" desc="等待用户发起咨询…" />
    <div v-if="loading" class="text-center py-2">
      <span class="text-xs text-ink-500">加载中...</span>
    </div>
    <div v-else-if="!hasMore && messages.length > 0" class="text-center py-2">
      <span class="text-xs text-ink-400">没有更多消息了</span>
    </div>
    <template v-for="it in items" :key="it.key">
      <TimeDivider v-if="it.kind === 'time'" :ts="it.ts" />
      <MessageBubble
        v-else
        :message="it.m"
        :is-mine="it.m.senderId === myUserId || it.m.senderId === 'me'"
        @retry="(id) => emit('retry', id)"
        @recall="(id) => emit('recall', id)"
      />
    </template>
  </div>
</template>
