<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { emojiList } from '@/utils/emoji'

const props = withDefaults(
  defineProps<{ variant?: 'desktop' | 'mobile'; disabled?: boolean }>(),
  { variant: 'desktop', disabled: false },
)

const emit = defineEmits<{
  (e: 'send-text', text: string): void
  (e: 'send-image', file: File): void
  (e: 'send-video', file: File): void
  (e: 'send-file', file: File): void
}>()

const text = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const imageInput = ref<HTMLInputElement>()
const videoInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()
const showEmoji = ref(false)

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

async function insertEmoji(s: string) {
  const ta = textareaRef.value
  if (!ta) { text.value += s; return }
  const start = ta.selectionStart ?? text.value.length
  const end = ta.selectionEnd ?? text.value.length
  text.value = text.value.slice(0, start) + s + text.value.slice(end)
  await nextTick()
  const pos = start + s.length
  ta.focus()
  ta.setSelectionRange(pos, pos)
}

function pickImage() { imageInput.value?.click() }
function pickVideo() { videoInput.value?.click() }
function pickFile()  { fileInput.value?.click() }

function onImageChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) emit('send-image', f)
  ;(e.target as HTMLInputElement).value = ''
}
function onVideoChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) emit('send-video', f)
  ;(e.target as HTMLInputElement).value = ''
}
function onFileChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) emit('send-file', f)
  ;(e.target as HTMLInputElement).value = ''
}

const tools = [
  { icon: '😊', label: '表情',     action: 'emoji' },
  { icon: '🖼️', label: '图片',     action: 'image' },
  { icon: '📎', label: '文件',     action: 'file' },
  { icon: '🎞️', label: '视频',     action: 'video' },
  { icon: '📦', label: '订单卡片', action: 'order' },
  { icon: '🎟️', label: '优惠券',   action: 'coupon' },
  { icon: '⚡', label: '快捷话术', action: 'quick' },
]

function onToolClick(action: string) {
  if (action === 'emoji') { showEmoji.value = !showEmoji.value; return }
  if (action === 'image') return pickImage()
  if (action === 'video') return pickVideo()
  if (action === 'file')  return pickFile()
  // 其它：订单/优惠券/快捷话术 占位 — 后端就绪后接入
}
</script>

<template>
  <div v-if="variant === 'mobile'" class="border-t border-line-light bg-white p-2 relative">
    <div class="flex items-end gap-2">
      <button class="shrink-0 px-2 text-ink-600" @click="showEmoji = !showEmoji">😊</button>
      <button class="shrink-0 px-2 text-ink-600" @click="pickImage">🖼️</button>
      <button class="shrink-0 px-2 text-ink-600" @click="pickVideo">🎞️</button>
      <textarea
        ref="textareaRef"
        v-model="text"
        :disabled="disabled"
        :placeholder="disabled ? '未连接…' : '请输入消息'"
        :rows="1"
        class="flex-1 resize-none rounded-md border border-line-light px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-500 disabled:bg-bg-soft"
        @keydown="handleKeydown"
      />
      <button
        class="shrink-0 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-sm px-4 py-2 disabled:opacity-50"
        :disabled="disabled || !text.trim()"
        @click="handleSend"
      >发送</button>
    </div>
    <div v-if="showEmoji" class="absolute left-0 right-0 bottom-full bg-white border-t border-line-light p-2 grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
      <button
        v-for="e in emojiList"
        :key="e.shortcut"
        class="text-xl hover:bg-bg-soft rounded"
        @click="insertEmoji(e.emoji)"
      >{{ e.emoji }}</button>
    </div>
    <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onImageChange" />
    <input ref="videoInput" type="file" accept="video/*" class="hidden" @change="onVideoChange" />
    <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
  </div>

  <div v-else class="bg-white relative">
    <!-- 工具栏 -->
    <div class="flex items-center gap-6 px-6 h-11 border-t border-line-light">
      <button
        v-for="t in tools"
        :key="t.label"
        class="flex items-center gap-1.5 text-xs text-ink-700 hover:text-brand-500"
        @click="onToolClick(t.action)"
      >
        <span class="text-sm">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
      </button>
    </div>

    <!-- 表情面板 -->
    <div v-if="showEmoji" class="absolute left-0 right-0 bottom-full bg-white border border-line-light shadow-card rounded-md p-3 grid grid-cols-12 gap-1 max-h-56 overflow-y-auto z-10 mx-4 mb-1">
      <button
        v-for="e in emojiList"
        :key="e.shortcut"
        class="text-xl hover:bg-bg-soft rounded py-1"
        @click="insertEmoji(e.emoji); showEmoji = false"
      >{{ e.emoji }}</button>
    </div>

    <!-- 输入区 -->
    <div class="bg-white px-4 py-3 border-t border-line-light">
      <textarea
        ref="textareaRef"
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

    <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onImageChange" />
    <input ref="videoInput" type="file" accept="video/*" class="hidden" @change="onVideoChange" />
    <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
  </div>
</template>
