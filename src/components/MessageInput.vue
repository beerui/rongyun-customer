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

function pickImage() { fileInput.value?.click() }
function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) emit('send-image', f)
  ;(e.target as HTMLInputElement).value = ''
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
  <div v-if="variant === 'mobile'" class="border-t border-line-light bg-white p-2">
    <div class="flex items-end gap-2">
      <textarea
        v-model="text"
        :disabled="disabled"
        :placeholder="disabled ? '未连接…' : '请输入消息'"
        :rows="1"
        class="flex-1 resize-none rounded-md border border-line-light px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-500 disabled:bg-bg-soft"
        @keydown="handleKeydown"
      />
      <button class="shrink-0 px-2 text-ink-600" @click="pickImage">🖼️</button>
      <button
        class="shrink-0 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-2 disabled:opacity-50"
        :disabled="disabled || !text.trim()"
        @click="handleSend"
      >发送</button>
    </div>
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
  </div>

  <div v-else class="bg-white">
    <!-- 工具栏（独立于输入框） -->
    <div class="flex items-center gap-6 px-6 h-11 border-t border-line-light">
      <button
        v-for="t in tools"
        :key="t.label"
        class="flex items-center gap-1.5 text-xs text-ink-700 hover:text-brand-500"
        @click="t.action === 'image' ? pickImage() : null"
      >
        <span class="text-sm">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
      </button>
    </div>

    <!-- 输入框 -->
    <div class="bg-white px-4 py-3 border-t border-line-light">
      <textarea
        v-model="text"
        :disabled="disabled"
        placeholder="输入回复内容，或点击上方「一键采用」AI建议..."
        rows="3"
        class="w-full resize-none text-[13px] bg-transparent focus:outline-none placeholder:text-ink-600/70 disabled:text-ink-600"
        @keydown="handleKeydown"
      />
      <div class="flex items-center justify-end gap-3 mt-2">
        <button class="text-xs text-ink-700 hover:text-brand-500">存为话术</button>
        <button
          class="rounded-md bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-xs px-5 py-1.5 disabled:opacity-50"
          :disabled="disabled || !text.trim()"
          @click="handleSend"
        >发送</button>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
  </div>
</template>
