<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { type ConversationTag, TOOLBAR_BUTTONS, getToolbarPermissions } from '@/constants/chat-toolbar'
import { useComposerStore } from '@/stores/composer'
import { emojiList } from '@/utils/emoji'

const props = withDefaults(
  defineProps<{
    variant?: 'desktop' | 'mobile'
    disabled?: boolean
    /** 角色：客服 / 访客 */
    role?: 'agent' | 'user'
    /** 会话标签（用于工作台动态权限） */
    conversationTag?: ConversationTag
    /** 是否显示存为话术按钮（仅客服端） */
    showSaveFastReply?: boolean
  }>(),
  {
    variant: 'desktop',
    disabled: false,
    role: 'user',
    showSaveFastReply: false,
  },
)

const emit = defineEmits<{
  (e: 'send-text', text: string): void
  (e: 'send-image', file: File): void
  (e: 'send-video', file: File): void
  (e: 'send-file', file: File): void
  (e: 'open-drawer', kind: ToolbarDrawerKind): void
}>()

type ToolbarDrawerKind = 'order' | 'product' | 'coupon' | 'quick' | 'complaint' | 'agent' | 'platform'

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
watch(
  () => composer.version,
  () => {
    text.value = composer.draft
    nextTick(() => textareaRef.value?.focus())
  },
)

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
  if (!ta) {
    text.value += s
    return
  }
  const start = ta.selectionStart ?? text.value.length
  const end = ta.selectionEnd ?? text.value.length
  text.value = text.value.slice(0, start) + s + text.value.slice(end)
  await nextTick()
  const pos = start + s.length
  ta.focus()
  ta.setSelectionRange(pos, pos)
}

function insertEmojiAndClose(s: string) {
  insertEmoji(s)
  showEmoji.value = false
}

function pickImage() {
  imageInput.value?.click()
}
function pickVideo() {
  videoInput.value?.click()
}
function pickFile() {
  fileInput.value?.click()
}

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

interface Tool {
  label: string
  action: string
  visible: boolean
}

// 统一权限管理：根据 role + conversationTag 自动计算
const permissions = computed(() => {
  const auto = getToolbarPermissions({
    role: props.role,
    conversationTag: props.conversationTag,
  })

  return {
    emoji: auto.emoji,
    complaint: auto.complaint,
    agent: auto.agent,
    order: auto.order,
    product: auto.product,
    image: auto.image,
    video: auto.video,
    file: auto.file,
    coupon: auto.coupon,
    quick: auto.quick,
    platform: auto.platform,
  }
})

const tools = computed<Tool[]>(() => [
  { label: '表情', action: 'emoji', visible: permissions.value.emoji },
  { label: '我要投诉', action: 'complaint', visible: permissions.value.complaint },
  { label: '转人工', action: 'agent', visible: permissions.value.agent },
  { label: '发订单', action: 'order', visible: permissions.value.order },
  { label: '发商品', action: 'product', visible: permissions.value.product },
  { label: '图片', action: 'image', visible: permissions.value.image },
  { label: '视频', action: 'video', visible: permissions.value.video },
  { label: '文件', action: 'file', visible: permissions.value.file },
  { label: '优惠券', action: 'coupon', visible: permissions.value.coupon },
  { label: '快捷话术', action: 'quick', visible: permissions.value.quick },
  { label: '平台客服', action: 'platform', visible: permissions.value.platform },
])

const visibleTools = computed(() => tools.value.filter((t) => t.visible))

function onToolClick(action: string) {
  if (action === 'emoji') {
    showEmoji.value = !showEmoji.value
    return
  }
  if (action === 'image') return pickImage()
  if (action === 'video') return pickVideo()
  if (action === 'file') return pickFile()
  emit('open-drawer', action as ToolbarDrawerKind)
}

// 移动端辅助方法
function toggleMobilePlus() {
  showMobilePlus.value = !showMobilePlus.value
  showEmoji.value = false
}

function toggleMobileEmoji() {
  showEmoji.value = !showEmoji.value
  showMobilePlus.value = false
}

function closeMobileMenus() {
  showMobilePlus.value = false
  showEmoji.value = false
}

function onMobileToolClick(action: string) {
  showMobilePlus.value = false
  if (action === 'image') return pickImage()
  if (action === 'video') return pickVideo()
  if (action === 'file') return pickFile()
  emit('open-drawer', action as ToolbarDrawerKind)
}

// 移动端可见工具（排除表情，表情有单独按钮）
const mobileVisibleTools = computed(() => visibleTools.value.filter((t) => t.action !== 'emoji'))
</script>

<template>
  <!-- ========== Mobile ========== -->
  <div v-if="variant === 'mobile'" class="border-t border-line-light bg-white relative">
    <div class="flex items-center gap-2 px-2 py-2">
      <button
        class="shrink-0 w-9 h-9 rounded-full border border-line-light text-lg text-ink-700 flex items-center justify-center hover:bg-bg-soft"
        :class="{ 'bg-bg-soft': showMobilePlus }"
        @click="toggleMobilePlus"
      >
        +
      </button>
      <button
        class="shrink-0 w-9 h-9 rounded-full border border-line-light text-lg flex items-center justify-center hover:bg-bg-soft"
        :class="{ 'bg-bg-soft': showEmoji }"
        data-action="emoji"
        @click="toggleMobileEmoji"
      >
        😊
      </button>
      <textarea
        ref="textareaRef"
        v-model="text"
        :disabled="disabled"
        :placeholder="disabled ? '未连接…' : '请输入消息'"
        :rows="1"
        class="flex-1 min-w-0 resize-none rounded-full border border-line-light px-4 py-2 text-sm bg-bg-soft focus:outline-none focus:border-brand-500 focus:bg-white disabled:opacity-60"
        @keydown="handleKeydown"
        @focus="closeMobileMenus"
      />
      <button
        class="shrink-0 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm h-9 px-4 disabled:opacity-50"
        :disabled="disabled || !text.trim()"
        @click="handleSend"
      >
        发送
      </button>
    </div>

    <div
      v-if="showEmoji"
      ref="emojiPopRef"
      class="border-t border-line-light p-2 grid grid-cols-8 gap-1 max-h-56 overflow-y-auto scrollbar-thin"
    >
      <button v-for="e in emojiList" :key="e.shortcut" class="text-2xl hover:bg-bg-soft rounded py-1" @click="insertEmoji(e.emoji)">
        {{ e.emoji }}
      </button>
    </div>

    <div v-if="showMobilePlus" class="border-t border-line-light p-4 grid grid-cols-4 gap-3">
      <button
        v-for="tool in mobileVisibleTools"
        :key="tool.action"
        class="flex flex-col items-center gap-1.5 py-2"
        @click="onMobileToolClick(tool.action)"
      >
        <span class="w-12 h-12 rounded-xl bg-bg-soft flex items-center justify-center text-2xl">
          {{ TOOLBAR_BUTTONS[tool.action as keyof typeof TOOLBAR_BUTTONS].icon }}
        </span>
        <span class="text-[11px] text-ink-700">{{ tool.label }}</span>
      </button>
    </div>

    <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onImageChange" />
    <input ref="videoInput" type="file" accept="video/*" class="hidden" @change="onVideoChange" />
    <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
  </div>

  <!-- ========== Desktop ========== -->
  <div v-else class="bg-white relative">
    <div class="flex items-center gap-6 px-6 pt-[20px]" :class="{ 'border-t border-line-light': role === 'agent' }">
      <button
        v-for="t in visibleTools"
        :key="t.label"
        class="flex items-center gap-1.5 text-xs text-ink-700 hover:text-brand-500 border border-line-light rounded-[3px] px-[20px] py-[8px]"
        :data-action="t.action"
        @click="onToolClick(t.action)"
      >
        {{ t.label }}
      </button>
    </div>

    <div
      v-if="showEmoji"
      ref="emojiPopRef"
      class="absolute left-4 bottom-full w-80 bg-white border border-line-light shadow-card rounded-md p-2 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto z-10 mb-1 scrollbar-thin"
    >
      <button v-for="e in emojiList" :key="e.shortcut" class="text-lg hover:bg-bg-soft rounded py-1" @click="insertEmojiAndClose(e.emoji)">
        {{ e.emoji }}
      </button>
    </div>

    <div class="px-[20px] py-[16px]">
      <div class="p-[16px] border border-line-light rounded-[5px]">
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
          <button v-if="showSaveFastReply" class="text-xs text-ink-700 hover:text-brand-500">存为话术</button>
          <button
            class="rounded-md bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-xs px-[20px] py-[10px] disabled:opacity-50"
            :disabled="disabled || !text.trim()"
            @click="handleSend"
          >
            发送
          </button>
        </div>
      </div>
    </div>

    <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onImageChange" />
    <input ref="videoInput" type="file" accept="video/*" class="hidden" @change="onVideoChange" />
    <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
  </div>
</template>
