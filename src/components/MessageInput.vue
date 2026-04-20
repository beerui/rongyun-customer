<script setup lang="ts">
import { ref, nextTick, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { emojiList } from '@/utils/emoji'
import { useComposerStore } from '@/stores/composer'

const props = withDefaults(
  defineProps<{
    variant?: 'desktop' | 'mobile'
    disabled?: boolean
    /** 控制各工具按钮的可见性（按当前接入用户的类型判断） */
    showOrder?: boolean
    showProduct?: boolean
    showCoupon?: boolean
    showQuick?: boolean
  }>(),
  { variant: 'desktop', disabled: false, showOrder: true, showProduct: true, showCoupon: true, showQuick: true },
)

const emit = defineEmits<{
  (e: 'send-text', text: string): void
  (e: 'send-image', file: File): void
  (e: 'send-video', file: File): void
  (e: 'send-file', file: File): void
  (e: 'open-drawer', kind: 'order' | 'product' | 'coupon' | 'quick'): void
}>()

const composer = useComposerStore()
const text = ref(composer.draft)
const textareaRef = ref<HTMLTextAreaElement>()
const imageInput = ref<HTMLInputElement>()
const videoInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()
const showEmoji = ref(false)
const showMobilePlus = ref(false)
const emojiPopRef = ref<HTMLElement>()

// 点击弹框与「表情」按钮之外的区域，自动关闭弹框。
// 注意：触发按钮自己有 toggle 逻辑，不能被文档监听抢先关闭——通过 data-action="emoji" 识别并忽略。
function onDocumentClick(e: MouseEvent) {
  if (!showEmoji.value) return
  const target = e.target as HTMLElement | null
  if (!target) return
  if (emojiPopRef.value?.contains(target)) return
  if (target.closest('[data-action="emoji"]')) return
  showEmoji.value = false
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

// 外部通过 composer.insert() 填入文本时同步到本地输入框
watch(() => composer.version, () => {
  text.value = composer.draft
  nextTick(() => textareaRef.value?.focus())
})

function handleSend() {
  const t = text.value.trim()
  if (!t || props.disabled) return
  emit('send-text', t)
  text.value = ''
  composer.clear()
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

interface Tool { icon: string; label: string; action: string; visible: boolean }

const tools = computed<Tool[]>(() => [
  { icon: '😊',  label: '表情',     action: 'emoji',   visible: true },
  { icon: '🖼️',  label: '图片',     action: 'image',   visible: true },
  { icon: '🎞️',  label: '视频',     action: 'video',   visible: true },
  { icon: '📎',  label: '文件',     action: 'file',    visible: true },
  { icon: '📦',  label: '订单列表', action: 'order',   visible: props.showOrder },
  { icon: '🛍️',  label: '商品列表', action: 'product', visible: props.showProduct },
  { icon: '🎟️',  label: '优惠券',   action: 'coupon',  visible: props.showCoupon },
  { icon: '⚡',  label: '快捷话术', action: 'quick',   visible: props.showQuick },
])

const visibleTools = computed(() => tools.value.filter((t) => t.visible))

function onToolClick(action: string) {
  if (action === 'emoji') { showEmoji.value = !showEmoji.value; return }
  if (action === 'image') return pickImage()
  if (action === 'video') return pickVideo()
  if (action === 'file')  return pickFile()
  emit('open-drawer', action as any)
}
</script>

<template>
  <!-- ========== Mobile ========== -->
  <div v-if="variant === 'mobile'" class="border-t border-line-light bg-white relative">
    <div class="flex items-center gap-2 px-2 py-2">
      <button
        class="shrink-0 w-9 h-9 rounded-full border border-line-light text-lg text-ink-700 flex items-center justify-center hover:bg-bg-soft"
        :class="{ 'bg-bg-soft': showMobilePlus }"
        @click="showMobilePlus = !showMobilePlus; showEmoji = false"
      >+</button>
      <button
        class="shrink-0 w-9 h-9 rounded-full border border-line-light text-lg flex items-center justify-center hover:bg-bg-soft"
        :class="{ 'bg-bg-soft': showEmoji }"
        data-action="emoji"
        @click="showEmoji = !showEmoji; showMobilePlus = false"
      >😊</button>
      <textarea
        ref="textareaRef"
        v-model="text"
        :disabled="disabled"
        :placeholder="disabled ? '未连接…' : '请输入消息'"
        :rows="1"
        class="flex-1 min-w-0 resize-none rounded-full border border-line-light px-4 py-2 text-sm bg-bg-soft focus:outline-none focus:border-brand-500 focus:bg-white disabled:opacity-60"
        @keydown="handleKeydown"
        @focus="showMobilePlus = false; showEmoji = false"
      />
      <button
        class="shrink-0 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm h-9 px-4 disabled:opacity-50"
        :disabled="disabled || !text.trim()"
        @click="handleSend"
      >发送</button>
    </div>

    <div v-if="showEmoji" ref="emojiPopRef" class="border-t border-line-light p-2 grid grid-cols-8 gap-1 max-h-56 overflow-y-auto scrollbar-thin">
      <button
        v-for="e in emojiList"
        :key="e.shortcut"
        class="text-2xl hover:bg-bg-soft rounded py-1"
        @click="insertEmoji(e.emoji)"
      >{{ e.emoji }}</button>
    </div>

    <div v-if="showMobilePlus" class="border-t border-line-light p-4 grid grid-cols-4 gap-3">
      <button class="flex flex-col items-center gap-1.5 py-2" @click="pickImage(); showMobilePlus = false">
        <span class="w-12 h-12 rounded-xl bg-bg-soft flex items-center justify-center text-2xl">🖼️</span>
        <span class="text-[11px] text-ink-700">图片</span>
      </button>
      <button class="flex flex-col items-center gap-1.5 py-2" @click="pickVideo(); showMobilePlus = false">
        <span class="w-12 h-12 rounded-xl bg-bg-soft flex items-center justify-center text-2xl">🎞️</span>
        <span class="text-[11px] text-ink-700">视频</span>
      </button>
      <button class="flex flex-col items-center gap-1.5 py-2" @click="pickFile(); showMobilePlus = false">
        <span class="w-12 h-12 rounded-xl bg-bg-soft flex items-center justify-center text-2xl">📎</span>
        <span class="text-[11px] text-ink-700">文件</span>
      </button>
      <button
        v-if="showOrder"
        class="flex flex-col items-center gap-1.5 py-2"
        @click="emit('open-drawer', 'order'); showMobilePlus = false"
      >
        <span class="w-12 h-12 rounded-xl bg-bg-soft flex items-center justify-center text-2xl">📦</span>
        <span class="text-[11px] text-ink-700">订单</span>
      </button>
      <button
        v-if="showProduct"
        class="flex flex-col items-center gap-1.5 py-2"
        @click="emit('open-drawer', 'product'); showMobilePlus = false"
      >
        <span class="w-12 h-12 rounded-xl bg-bg-soft flex items-center justify-center text-2xl">🛍️</span>
        <span class="text-[11px] text-ink-700">商品</span>
      </button>
      <button
        v-if="showCoupon"
        class="flex flex-col items-center gap-1.5 py-2"
        @click="emit('open-drawer', 'coupon'); showMobilePlus = false"
      >
        <span class="w-12 h-12 rounded-xl bg-bg-soft flex items-center justify-center text-2xl">🎟️</span>
        <span class="text-[11px] text-ink-700">优惠券</span>
      </button>
      <button
        v-if="showQuick"
        class="flex flex-col items-center gap-1.5 py-2"
        @click="emit('open-drawer', 'quick'); showMobilePlus = false"
      >
        <span class="w-12 h-12 rounded-xl bg-bg-soft flex items-center justify-center text-2xl">⚡</span>
        <span class="text-[11px] text-ink-700">话术</span>
      </button>
    </div>

    <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onImageChange" />
    <input ref="videoInput" type="file" accept="video/*" class="hidden" @change="onVideoChange" />
    <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
  </div>

  <!-- ========== Desktop ========== -->
  <div v-else class="bg-white relative">
    <div class="flex items-center gap-6 px-6 h-11 border-t border-line-light">
      <button
        v-for="t in visibleTools"
        :key="t.label"
        class="flex items-center gap-1.5 text-xs text-ink-700 hover:text-brand-500"
        :data-action="t.action"
        @click="onToolClick(t.action)"
      >
        <span class="text-sm">{{ t.icon }}</span>
        <span>{{ t.label }}</span>
      </button>
    </div>

    <div
      v-if="showEmoji"
      ref="emojiPopRef"
      class="absolute left-4 bottom-full w-80 bg-white border border-line-light shadow-card rounded-md p-2 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto z-10 mb-1 scrollbar-thin"
    >
      <button
        v-for="e in emojiList"
        :key="e.shortcut"
        class="text-lg hover:bg-bg-soft rounded py-1"
        @click="insertEmoji(e.emoji); showEmoji = false"
      >{{ e.emoji }}</button>
    </div>

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
