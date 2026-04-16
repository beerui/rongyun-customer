<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { Message } from '@/im'
import MessageBubble from './MessageBubble.vue'
import EmptyState from './EmptyState.vue'

const props = defineProps<{
  messages: Message[]
  myUserId: string
}>()

const emit = defineEmits<{ (e: 'retry', id: string): void }>()

const scroller = ref<HTMLElement>()

async function scrollToBottom() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

watch(() => props.messages.length, scrollToBottom)
</script>

<template>
  <div ref="scroller" class="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 bg-white">
    <EmptyState v-if="!messages.length" title="还没有消息" desc="等待用户发起咨询…" />
    <MessageBubble
      v-for="m in messages"
      :key="m.id"
      :message="m"
      :is-mine="m.senderId === myUserId || m.senderId === 'me'"
      @retry="(id) => emit('retry', id)"
    />
  </div>
</template>
