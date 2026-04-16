<script setup lang="ts">
import type { Conversation } from '@/im'
import Avatar from './Avatar.vue'

defineProps<{
  item: Conversation
  active?: boolean
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
    class="flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-gray-100"
    :class="active ? 'bg-brand-50' : 'hover:bg-gray-50'"
  >
    <div class="relative shrink-0">
      <Avatar :src="item.avatar" :name="item.title" :size="44" />
      <span
        v-if="item.unread > 0"
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] leading-[18px] text-center"
      >{{ item.unread > 99 ? '99+' : item.unread }}</span>
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <div class="text-sm font-medium text-gray-800 truncate">{{ item.title }}</div>
        <div class="text-[11px] text-gray-400 shrink-0 ml-2">{{ formatTime(item.lastTime) }}</div>
      </div>
      <div class="text-xs text-gray-500 truncate mt-0.5">{{ item.lastMessage || '暂无消息' }}</div>
    </div>
  </div>
</template>
