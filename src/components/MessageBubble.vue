<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Message } from '@/im'
import Avatar from './Avatar.vue'
import { safeUrl } from '@/utils/sanitize'
import { translateText } from '@/apis/customer'

const props = defineProps<{
  message: Message
  isMine: boolean
}>()

const emit = defineEmits<{
  (e: 'retry', id: string): void
  (e: 'recall', id: string): void
}>()

const menuOpen = ref(false)
const menuX = ref(0)
const menuY = ref(0)

const canRecall = computed(
  () =>
    props.isMine &&
    !props.message.recalled &&
    props.message.status === 'sent' &&
    Date.now() - props.message.sentTime <= 120_000,
)

function openMenu(e: MouseEvent) {
  if (!canRecall.value) return
  e.preventDefault()
  menuX.value = e.clientX
  menuY.value = e.clientY
  menuOpen.value = true
  const close = () => {
    menuOpen.value = false
    document.removeEventListener('click', close)
  }
  setTimeout(() => document.addEventListener('click', close), 0)
}

function onRecall() {
  menuOpen.value = false
  emit('recall', props.message.id)
}

const translating = ref(false)
const translated = ref('')
const translateErr = ref('')

async function onTranslate() {
  if (translating.value || translated.value) return
  translating.value = true
  translateErr.value = ''
  try {
    const res: any = await translateText(String(props.message.content))
    const text = typeof res === 'string' ? res : res?.translated ?? res?.data ?? ''
    if (!text) throw new Error('翻译接口未返回文本')
    translated.value = text
  } catch (e: any) {
    translateErr.value = e?.message || '翻译失败'
  } finally {
    translating.value = false
  }
}

const canTranslate = computed(
  () => !props.isMine && props.message.type === 'text' && !props.message.recalled,
)

function formatSize(size?: number) {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

function formatDuration(s?: number) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}
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
    <div
      class="flex flex-col max-w-[70%]"
      :class="isMine ? 'items-end' : 'items-start'"
      @contextmenu="openMenu"
    >
      <!-- 已撤回占位 -->
      <div
        v-if="message.recalled"
        class="px-2.5 py-1.5 rounded-md text-[11px] text-ink-600 bg-bg-soft italic"
      >
        {{ isMine ? '你撤回了一条消息' : '对方撤回了一条消息' }}
      </div>

      <!-- 文本 -->
      <div
        v-else-if="message.type === 'text'"
        class="px-2.5 py-2 rounded-md text-[13px] leading-relaxed whitespace-pre-wrap break-words"
        :class="isMine ? 'bg-[#FEF5F5] text-ink-800' : 'bg-[#F7F8FC] text-ink-800'"
      >
        {{ message.content }}
        <div
          v-if="translated"
          class="mt-1.5 pt-1.5 border-t border-dashed border-ink-300/40 text-[12px] text-ink-600"
        >
          <span class="text-ink-500 mr-1">译：</span>{{ translated }}
        </div>
        <div v-if="translateErr" class="mt-1 text-[11px] text-red-500">{{ translateErr }}</div>
      </div>

      <!-- 图片 -->
      <a
        v-else-if="message.type === 'image'"
        :href="safeUrl((message.content as any).url)"
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-md overflow-hidden max-w-[260px] block"
      >
        <img :src="safeUrl((message.content as any).url)" class="block w-full" alt="" />
      </a>

      <!-- 视频 -->
      <div v-else-if="message.type === 'video'" class="rounded-md overflow-hidden bg-black max-w-[320px]">
        <video
          :src="safeUrl((message.content as any).url)"
          class="block w-full max-h-[240px]"
          controls
          preload="metadata"
        />
        <div class="flex items-center justify-between text-[11px] text-white/80 bg-black/60 px-2 py-1">
          <span class="truncate">{{ (message.content as any).name || '视频' }}</span>
          <span class="shrink-0 ml-2">{{ formatDuration((message.content as any).duration) }}</span>
        </div>
      </div>

      <!-- 文件 -->
      <a
        v-else-if="message.type === 'file'"
        :href="safeUrl((message.content as any).url)"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 px-3 py-2 rounded-md bg-[#F7F8FC] text-xs text-ink-700 max-w-[260px]"
      >
        <span class="text-lg">📎</span>
        <div class="flex flex-col min-w-0">
          <span class="truncate">{{ (message.content as any).name }}</span>
          <span class="text-[10px] text-ink-600">{{ formatSize((message.content as any).size) }}</span>
        </div>
      </a>

      <!-- 商品卡片 -->
      <a
        v-else-if="message.type === 'product'"
        :href="safeUrl((message.content as any).url)"
        target="_blank"
        rel="noopener noreferrer"
        class="flex gap-2.5 p-2.5 rounded-md bg-white border border-line-light max-w-[300px] hover:border-brand-500"
      >
        <img :src="safeUrl((message.content as any).cover)" class="w-20 h-20 rounded object-cover shrink-0" alt="" />
        <div class="flex-1 min-w-0 flex flex-col">
          <div class="text-[13px] text-ink-900 line-clamp-2">{{ (message.content as any).title }}</div>
          <div class="text-[11px] text-ink-600 mt-0.5">{{ (message.content as any).spec }}</div>
          <div class="mt-auto flex items-end gap-1.5">
            <span class="text-brand-500 text-sm font-semibold">¥ {{ (message.content as any).price }}</span>
            <span v-if="(message.content as any).originPrice" class="text-[11px] text-ink-600 line-through">¥ {{ (message.content as any).originPrice }}</span>
          </div>
        </div>
      </a>

      <!-- 订单卡片 -->
      <div
        v-else-if="message.type === 'order'"
        class="rounded-md bg-white border border-line-light max-w-[320px] overflow-hidden"
      >
        <div class="flex items-center justify-between px-3 py-2 bg-bg-app">
          <div class="text-[11px] text-ink-600">{{ (message.content as any).orderId }}</div>
          <span class="text-[10px] px-2 py-0.5 rounded bg-[#FFF7E8] text-[#D25F00]">
            {{ (message.content as any).status }}
          </span>
        </div>
        <div class="p-3 space-y-2">
          <div
            v-for="(it, i) in (message.content as any).items"
            :key="i"
            class="flex items-center gap-2"
          >
            <img :src="safeUrl(it.cover)" class="w-10 h-10 rounded object-cover shrink-0" alt="" />
            <div class="flex-1 min-w-0">
              <div class="text-xs text-ink-800 truncate">{{ it.title }}</div>
              <div class="text-[11px] text-ink-600">¥{{ it.price }} × {{ it.qty }}</div>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between px-3 py-2 border-t border-line-light">
          <span class="text-[11px] text-ink-600">合计</span>
          <span class="text-brand-500 text-sm font-semibold">¥ {{ (message.content as any).totalAmount }}</span>
        </div>
      </div>

      <!-- 优惠券卡片 -->
      <div
        v-else-if="message.type === 'coupon'"
        class="flex items-center gap-3 p-3 rounded-md bg-gradient-to-r from-brand-50 to-white border border-brand-100 max-w-[300px]"
      >
        <div class="text-brand-500 text-2xl font-bold shrink-0">¥{{ (message.content as any).amount }}</div>
        <div class="flex-1 min-w-0 border-l border-dashed border-brand-300 pl-3">
          <div class="text-[13px] text-ink-900 font-medium truncate">{{ (message.content as any).title }}</div>
          <div class="text-[11px] text-ink-600">{{ (message.content as any).threshold ? `满${(message.content as any).threshold}可用` : '无门槛' }} · 至 {{ (message.content as any).expireAt }}</div>
        </div>
      </div>

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

      <button
        v-if="canTranslate && !translated"
        class="mt-1 text-[10px] text-ink-500 hover:text-brand-500"
        :disabled="translating"
        @click="onTranslate"
      >{{ translating ? '翻译中…' : '翻译' }}</button>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="menuOpen"
      class="fixed z-50 bg-white border border-line-light rounded-md shadow-card py-1 min-w-[120px]"
      :style="{ left: menuX + 'px', top: menuY + 'px' }"
      @click.stop
    >
      <button
        class="w-full text-left px-3 py-1.5 text-[12px] text-ink-800 hover:bg-bg-soft"
        @click="onRecall"
      >撤回</button>
    </div>
  </Teleport>
</template>
