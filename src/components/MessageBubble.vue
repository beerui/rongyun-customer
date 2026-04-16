<script setup lang="ts">
import type { Message } from '@/im'
import Avatar from './Avatar.vue'

defineProps<{
  message: Message
  isMine: boolean
}>()

defineEmits<{ (e: 'retry', id: string): void }>()

function formatSize(size?: number) {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

function formatDuration(s?: number) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}
</script>

<template>
  <div
    class="flex items-start gap-2.5 mb-3"
    :class="isMine ? 'flex-row-reverse' : 'flex-row'"
  >
    <Avatar
      :src="message.senderAvatar"
      :name="message.senderName || (isMine ? '我' : '用户')"
      :size="38"
      :bg="isMine ? '#FEF5F5' : '#E8FFEA'"
    />
    <div class="flex flex-col max-w-[70%]" :class="isMine ? 'items-end' : 'items-start'">
      <!-- 文本 -->
      <div
        v-if="message.type === 'text'"
        class="px-2.5 py-2 rounded-md text-[13px] leading-relaxed whitespace-pre-wrap break-words"
        :class="isMine ? 'bg-[#FEF5F5] text-ink-800' : 'bg-[#F7F8FC] text-ink-800'"
      >
        {{ message.content }}
      </div>

      <!-- 图片 -->
      <a
        v-else-if="message.type === 'image'"
        :href="(message.content as any).url"
        target="_blank"
        class="rounded-md overflow-hidden max-w-[260px] block"
      >
        <img :src="(message.content as any).url" class="block w-full" alt="" />
      </a>

      <!-- 视频 -->
      <div v-else-if="message.type === 'video'" class="rounded-md overflow-hidden bg-black max-w-[320px]">
        <video
          :src="(message.content as any).url"
          class="block w-full max-h-[240px]"
          controls
          preload="metadata"
        />
        <div class="flex items-center justify-between text-[11px] text-white/80 bg-black/60 px-2 py-1">
          <span class="truncate">{{ (message.content as any).name || '视频' }}</span>
          <span class="shrink-0 ml-2">{{ formatDuration((message.content as any).duration) }}</span>
        </div>
      </div>

      <!-- 文件 -->
      <a
        v-else-if="message.type === 'file'"
        :href="(message.content as any).url"
        target="_blank"
        class="flex items-center gap-2 px-3 py-2 rounded-md bg-[#F7F8FC] text-xs text-ink-700 max-w-[260px]"
      >
        <span class="text-lg">📎</span>
        <div class="flex flex-col min-w-0">
          <span class="truncate">{{ (message.content as any).name }}</span>
          <span class="text-[10px] text-ink-600">{{ formatSize((message.content as any).size) }}</span>
        </div>
      </a>

      <div v-else class="px-2.5 py-2 rounded-md bg-bg-soft text-[11px] text-ink-600">
        [不支持的消息类型]
      </div>

      <div
        v-if="message.status !== 'sent'"
        class="flex items-center gap-1 mt-1 text-[10px] text-ink-600/70"
      >
        <span v-if="message.status === 'sending'">发送中…</span>
        <button
          v-else
          class="text-brand-600 hover:underline"
          @click="$emit('retry', message.id)"
        >发送失败，重试</button>
      </div>
    </div>
  </div>
</template>
