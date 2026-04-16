<script setup lang="ts">
import type { Message } from '@/im'
import Avatar from './Avatar.vue'

defineProps<{
  message: Message
  isMine: boolean
}>()

defineEmits<{ (e: 'retry', id: string): void }>()
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

      <div v-else-if="message.type === 'image'" class="rounded-md overflow-hidden max-w-[260px]">
        <img :src="(message.content as any).url" class="block w-full" alt="" />
      </div>

      <a
        v-else-if="message.type === 'file'"
        :href="(message.content as any).url"
        target="_blank"
        class="flex items-center gap-2 px-2.5 py-2 rounded-md bg-[#F7F8FC] text-xs text-ink-700"
      >
        <span>📎</span>
        <span class="truncate max-w-[160px]">{{ (message.content as any).name }}</span>
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
