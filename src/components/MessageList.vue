<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
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

const scroller = ref<HTMLElement>()

/**
 * 窗口化策略：只渲染最近 WINDOW_SIZE 条，超出则顶部显示"加载更早"。
 * 不用完整虚拟滚动的原因：消息高度差异极大（文本/图/卡片），估算错会抖动。
 */
const WINDOW_SIZE = 150
const WINDOW_STEP = 100
const visibleCount = ref(WINDOW_SIZE)

const windowed = computed(() => {
  const total = props.messages.length
  if (visibleCount.value >= total) return props.messages
  return props.messages.slice(total - visibleCount.value)
})

const hasMore = computed(() => visibleCount.value < props.messages.length)

async function loadEarlier() {
  if (!scroller.value) {
    visibleCount.value += WINDOW_STEP
    return
  }
  const prevHeight = scroller.value.scrollHeight
  const prevTop = scroller.value.scrollTop
  visibleCount.value += WINDOW_STEP
  await nextTick()
  const diff = scroller.value.scrollHeight - prevHeight
  scroller.value.scrollTop = prevTop + diff
}

async function scrollToBottom() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

watch(
  () => props.messages.length,
  (n, prev) => {
    if (n > prev) scrollToBottom()
  },
)

const FIVE_MIN = 5 * 60 * 1000
const items = computed(() => {
  const out: Array<{ kind: 'time'; ts: number; key: string } | { kind: 'msg'; m: Message; key: string }> = []
  let lastTs = 0
  for (const m of windowed.value) {
    if (!lastTs || m.sentTime - lastTs > FIVE_MIN) {
      out.push({ kind: 'time', ts: m.sentTime, key: `t_${m.sentTime}` })
    }
    out.push({ kind: 'msg', m, key: m.id })
    lastTs = m.sentTime
  }
  return out
})
</script>

<template>
  <div ref="scroller" class="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 bg-white">
    <EmptyState v-if="!messages.length" title="还没有消息" desc="等待用户发起咨询…" />
    <div v-if="hasMore" class="text-center mb-3">
      <button class="text-[11px] text-ink-500 hover:text-brand-500 px-3 py-1 rounded bg-bg-soft" @click="loadEarlier">
        加载更早的消息（剩余 {{ messages.length - visibleCount }} 条）
      </button>
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
