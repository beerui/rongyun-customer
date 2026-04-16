<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{ variant?: 'desktop' | 'mobile'; disabled?: boolean }>(),
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

function pickImage() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('send-image', file)
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<template>
  <div class="border-t bg-white" :class="variant === 'mobile' ? 'p-2' : 'p-3'">
    <div
      v-if="variant === 'desktop'"
      class="flex gap-2 mb-2 text-gray-500 text-lg"
    >
      <button class="hover:text-brand-600" @click="pickImage" title="图片">🖼️</button>
      <button class="hover:text-brand-600" title="表情">😊</button>
      <button class="hover:text-brand-600" title="文件">📎</button>
    </div>

    <div class="flex items-end gap-2">
      <textarea
        v-model="text"
        :disabled="disabled"
        :placeholder="disabled ? '未连接…' : '输入消息，Enter 发送，Shift+Enter 换行'"
        :rows="variant === 'mobile' ? 1 : 3"
        class="flex-1 resize-none rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-500 disabled:bg-gray-50"
        @keydown="handleKeydown"
      />
      <button
        v-if="variant === 'mobile'"
        class="shrink-0 px-2 text-gray-500"
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
