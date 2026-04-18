<script setup lang="ts">
import { computed } from 'vue'
import { useImStore } from '@/stores/im'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import EmptyState from './EmptyState.vue'

defineProps<{
  title?: string
  subtitle?: string
  variant?: 'desktop' | 'mobile'
  showStart?: boolean
  startTime?: string
}>()

const im = useImStore()
const auth = useAuthStore()
const toast = useToastStore()

const statusText = computed(() => {
  switch (im.status) {
    case 'connecting': return '正在连接…'
    case 'disconnected': return '未连接'
    case 'error': return '连接异常'
    default: return ''
  }
})

const FIVE_MIN = 5 * 60 * 1000
const peerOnline = computed(() => {
  const now = Date.now()
  return im.messages.some(
    (m) =>
      m.senderId !== auth.userId &&
      m.senderId !== 'me' &&
      now - m.sentTime < FIVE_MIN,
  )
})

const showReconnectBanner = computed(
  () => !!im.currentTargetId && im.status !== 'connected',
)

function handleSendText(text: string) { im.sendTextMessage(text) }
function handleSendImage(file: File) { im.sendImageFile(file) }
function handleSendVideo(file: File) { im.sendVideoFile(file) }
function handleSendFile(file: File)  { im.sendFileMessage(file) }
function handleRecall(id: string) {
  im.recall(id).catch((e: Error) => toast.error(e.message))
}
</script>

<template>
  <div class="flex flex-col h-full bg-white">
    <div v-if="title" class="flex items-center justify-between px-4 py-3 border-b border-line-light bg-white">
      <div class="min-w-0 flex items-center gap-2">
        <div>
          <div class="text-sm font-semibold text-ink-900 truncate">{{ title }}</div>
          <div v-if="subtitle" class="text-xs text-ink-600 truncate">{{ subtitle }}</div>
        </div>
        <span
          v-if="peerOnline"
          class="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>在线
        </span>
      </div>
      <div v-if="statusText" class="text-xs text-warn-700">{{ statusText }}</div>
    </div>

    <div
      v-if="showReconnectBanner"
      class="px-4 py-2 bg-amber-50 text-[12px] text-amber-700 border-b border-amber-100 flex items-center justify-between"
    >
      <span>
        {{ im.status === 'connecting' ? '连接中，消息可能延迟…' : '连接已断开，新消息将无法收发' }}
      </span>
      <button
        v-if="im.status !== 'connecting'"
        class="text-brand-500 hover:underline"
        @click="im.connect(auth.rcToken).catch(() => {})"
      >重新连接</button>
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
        @retry="(id) => im.retry(id)"
        @recall="handleRecall"
      />
      <MessageInput
        :variant="variant || 'desktop'"
        :disabled="!im.connected"
        @send-text="handleSendText"
        @send-image="handleSendImage"
        @send-video="handleSendVideo"
        @send-file="handleSendFile"
      />
    </template>
  </div>
</template>
