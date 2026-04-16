<script setup lang="ts">
import type { Message } from '@/im'
import Avatar from './Avatar.vue'

const props = defineProps<{
  message: Message
  isMine: boolean
}>()

defineEmits<{ (e: 'retry', id: string): void }>()

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div
    class="flex gap-2 mb-4"
    :class="isMine ? 'flex-row-reverse' : 'flex-row'"
  >
    <Avatar :src="message.senderAvatar" :name="message.senderName" :size="36" />
    <div class="flex flex-col max-w-[70%]" :class="isMine ? 'items-end' : 'items-start'">
      <div v-if="message.senderName && !isMine" class="text-xs text-gray-500 mb-1">
        {{ message.senderName }}
      </div>

      <!-- 文本 -->
      <div
        v-if="message.type === 'text'"
        class="px-3 py-2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap break-words"
        :class="isMine ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'"
      >
        {{ message.content }}
      </div>

      <!-- 图片 -->
      <div v-else-if="message.type === 'image'" class="rounded-lg overflow-hidden max-w-[260px]">
        <img :src="(message.content as any).url" class="block w-full" alt="" />
      </div>

      <!-- 文件 -->
      <a
        v-else-if="message.type === 'file'"
        :href="(message.content as any).url"
        target="_blank"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm text-sm text-gray-700"
      >
        <span>📎</span>
        <span class="truncate max-w-[160px]">{{ (message.content as any).name }}</span>
      </a>

      <div v-else class="px-3 py-2 rounded-lg bg-gray-100 text-xs text-gray-500">
        [不支持的消息类型]
      </div>

      <div class="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
        <span>{{ formatTime(message.sentTime) }}</span>
        <span v-if="message.status === 'sending'">发送中…</span>
        <button
          v-else-if="message.status === 'failed'"
          class="text-red-500 hover:underline"
          @click="$emit('retry', message.id)"
        >
          发送失败，重试
        </button>
      </div>
    </div>
  </div>
</template>
