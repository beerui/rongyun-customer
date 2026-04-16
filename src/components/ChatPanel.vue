<script setup lang="ts">
import { computed } from 'vue'
import { useImStore } from '@/stores/im'
import { useAuthStore } from '@/stores/auth'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import EmptyState from './EmptyState.vue'

defineProps<{
  title?: string
  subtitle?: string
  variant?: 'desktop' | 'mobile'
  aiSuggestion?: string
  showStart?: boolean
  startTime?: string
}>()

const im = useImStore()
const auth = useAuthStore()

const statusText = computed(() => {
  switch (im.status) {
    case 'connecting': return '正在连接…'
    case 'disconnected': return '未连接'
    case 'error': return '连接异常'
    default: return ''
  }
})

function handleSendText(text: string) { im.sendTextMessage(text) }
function handleSendImage(file: File) {
  const url = URL.createObjectURL(file)
  im.sendImageMessage(url)
}
</script>

<template>
  <div class="flex flex-col h-full bg-white">
    <div v-if="title" class="flex items-center justify-between px-4 py-3 border-b border-line-light bg-white">
      <div class="min-w-0">
        <div class="text-sm font-semibold text-ink-900 truncate">{{ title }}</div>
        <div v-if="subtitle" class="text-xs text-ink-600 truncate">{{ subtitle }}</div>
      </div>
      <div v-if="statusText" class="text-xs text-warn-700">{{ statusText }}</div>
    </div>

    <div v-if="!im.currentTargetId" class="flex-1 flex items-center justify-center bg-bg-app">
      <EmptyState title="选择一个会话开始聊天" />
    </div>
    <template v-else>
      <div v-if="showStart" class="text-center py-3 text-[11px] text-ink-600/70 bg-bg-app">
        {{ startTime || '今天' }} 会话开始
      </div>
      <MessageList
        :messages="im.messages"
        :my-user-id="auth.userId"
        @retry="() => {}"
      />
      <MessageInput
        :variant="variant || 'desktop'"
        :disabled="!im.connected"
        :ai-suggestion="aiSuggestion"
        @send-text="handleSendText"
        @send-image="handleSendImage"
      />
    </template>
  </div>
</template>
