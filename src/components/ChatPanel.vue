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

function handleSendText(text: string) {
  im.sendTextMessage(text)
}

function handleSendImage(file: File) {
  // 预留：调用 OSS 上传服务后再发送
  const url = URL.createObjectURL(file)
  im.sendImageMessage(url)
}
</script>

<template>
  <div class="flex flex-col h-full bg-white">
    <div v-if="title" class="flex items-center justify-between px-4 py-3 border-b bg-white">
      <div class="min-w-0">
        <div class="text-sm font-medium text-gray-800 truncate">{{ title }}</div>
        <div v-if="subtitle" class="text-xs text-gray-500 truncate">{{ subtitle }}</div>
      </div>
      <div v-if="statusText" class="text-xs text-amber-600">{{ statusText }}</div>
    </div>

    <div v-if="!im.currentTargetId" class="flex-1 flex items-center justify-center bg-[#f5f7fa]">
      <EmptyState title="选择一个会话开始聊天" />
    </div>
    <template v-else>
      <MessageList
        :messages="im.messages"
        :my-user-id="auth.userId"
        @retry="() => {}"
      />
      <MessageInput
        :variant="variant || 'desktop'"
        :disabled="!im.connected"
        @send-text="handleSendText"
        @send-image="handleSendImage"
      />
    </template>
  </div>
</template>
