<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{ variant?: 'desktop' | 'mobile'; disabled?: boolean; aiSuggestion?: string }>(),
  { variant: 'desktop', disabled: false },
)

const emit = defineEmits<{
  (e: 'send-text', text: string): void
  (e: 'send-image', file: File): void
}>()

const text = ref('')
const fileInput = ref<HTMLInputElement>()

function handleSend() {
  const t = text.value.trim()
  if (!t || props.disabled) return
  emit('send-text', t)
  text.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && props.variant === 'desktop') {
    e.preventDefault()
    handleSend()
  }
}

function pickImage() { fileInput.value?.click() }
function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) emit('send-image', f)
  ;(e.target as HTMLInputElement).value = ''
}

function useAi() {
  if (props.aiSuggestion) text.value = props.aiSuggestion
}

const tools = [
  { icon: '😊', label: '表情' },
  { icon: '🖼️', label: '图片', action: 'image' },
  { icon: '📎', label: '文件' },
  { icon: '📦', label: '订单卡片' },
  { icon: '🎟️', label: '优惠券' },
  { icon: '⚡', label: '快捷话术' },
]
</script>

<template>
  <div class="border-t border-line-light bg-white" :class="variant === 'mobile' ? 'p-2' : 'px-4 pt-2 pb-3'">
    <!-- AI 建议条 -->
    <div
      v-if="variant === 'desktop' && aiSuggestion"
      class="flex items-center gap-2 mb-2 px-3 py-2 rounded-md bg-gradient-to-r from-brand-50 to-white border border-brand-100"
    >
      <span class="text-brand-500 text-xs">✨ AI 建议</span>
      <span class="flex-1 text-xs text-ink-700 truncate">{{ aiSuggestion }}</span>
      <button class="text-xs text-brand-600 hover:underline shrink-0" @click="useAi">一键采用</button>
    </div>

    <div v-if="variant === 'desktop'" class="flex gap-4 mb-2 text-ink-600">
      <button
        v-for="t in tools"
        :key="t.label"
        class="flex items-center gap-1 text-xs hover:text-brand-500"
        @click="t.action === 'image' ? pickImage() : null"
      >
        <span class="text-base">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
      </button>
    </div>

    <div class="flex items-end gap-2">
      <textarea
        v-model="text"
        :disabled="disabled"
        :placeholder="disabled ? '未连接…' : (variant === 'desktop' ? '输入回复内容，或点击上方「一键采用」AI建议...' : '请输入消息')"
        :rows="variant === 'mobile' ? 1 : 3"
        class="flex-1 resize-none rounded-md border border-line-light px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-500 disabled:bg-bg-soft"
        @keydown="handleKeydown"
      />
      <button
        v-if="variant === 'mobile'"
        class="shrink-0 px-2 text-ink-600"
        @click="pickImage"
      >🖼️</button>
      <button
        class="shrink-0 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-2 disabled:opacity-50"
        :disabled="disabled || !text.trim()"
        @click="handleSend"
      >发送</button>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
  </div>
</template>
