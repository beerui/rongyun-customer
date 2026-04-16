<script setup lang="ts">
import type { Conversation } from '@/im'
import Avatar from './Avatar.vue'

defineProps<{
  item: Conversation
  active?: boolean
  tag?: string
}>()

function formatTime(ts?: number) {
  if (!ts) return ''
  const d = new Date(ts)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<template>
  <div
    class="flex items-center gap-3 px-4 py-3 cursor-pointer border-l-2 transition-colors"
    :class="active
      ? 'bg-brand-50 border-l-brand-500'
      : 'border-l-transparent hover:bg-bg-soft'"
  >
    <div class="relative shrink-0">
      <Avatar :src="item.avatar" :name="item.title" :size="40" />
      <span
        v-if="item.unread > 0"
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] leading-[18px] text-center"
      >{{ item.unread > 99 ? '99+' : item.unread }}</span>
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 min-w-0">
          <div class="text-sm font-medium text-ink-900 truncate">{{ item.title }}</div>
          <span
            v-if="tag"
            class="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600"
          >{{ tag }}</span>
        </div>
        <div class="text-[11px] text-ink-600/70 shrink-0 ml-2">{{ formatTime(item.lastTime) }}</div>
      </div>
      <div class="text-xs text-ink-600 truncate mt-1">{{ item.lastMessage || '暂无消息' }}</div>
    </div>
  </div>
</template>
