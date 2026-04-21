<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useLightboxStore } from '@/stores/lightbox'
import { safeUrl } from '@/utils/sanitize'

const lb = useLightboxStore()

const loading = ref(false)
const natural = ref<{ w: number; h: number } | null>(null)

function onKeydown(e: KeyboardEvent) {
  if (!lb.isOpen) return
  if (e.key === 'Escape') lb.close()
  else if (e.key === 'ArrowLeft') lb.prev()
  else if (e.key === 'ArrowRight') lb.next()
}

watch(
  () => lb.isOpen,
  (open) => {
    if (open) {
      window.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      window.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
      natural.value = null
    }
  },
)

watch(
  () => lb.current,
  (url) => {
    if (!url) return
    loading.value = true
    natural.value = null
    const img = new Image()
    img.onload = () => {
      natural.value = { w: img.naturalWidth, h: img.naturalHeight }
      loading.value = false
    }
    img.onerror = () => {
      loading.value = false
    }
    img.src = url
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

function stop(e: Event) {
  e.stopPropagation()
}

// 控制右上角计数样式
const counter = computed(() => (lb.urls.length > 1 ? `${lb.index + 1} / ${lb.urls.length}` : ''))
</script>

<template>
  <Teleport to="body">
    <div v-if="lb.isOpen" class="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center select-none" @click="lb.close">
      <button
        class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center"
        title="关闭 (Esc)"
        @click.stop="lb.close"
      >
        ×
      </button>

      <div v-if="counter" class="absolute top-6 left-1/2 -translate-x-1/2 text-white/80 text-sm">
        {{ counter }}
      </div>

      <button
        v-if="lb.hasPrev"
        class="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center"
        title="上一张 (←)"
        @click.stop="lb.prev"
      >
        ‹
      </button>

      <button
        v-if="lb.hasNext"
        class="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl flex items-center justify-center"
        title="下一张 (→)"
        @click.stop="lb.next"
      >
        ›
      </button>

      <div class="max-w-[92vw] max-h-[88vh] flex items-center justify-center" @click="stop">
        <div v-if="loading" class="text-white/70 text-sm">加载中…</div>
        <img
          v-show="!loading"
          :src="safeUrl(lb.current)"
          :alt="''"
          class="max-w-[92vw] max-h-[88vh] object-contain rounded"
          draggable="false"
        />
      </div>

      <a
        v-if="lb.current"
        :href="safeUrl(lb.current)"
        target="_blank"
        rel="noopener noreferrer"
        class="absolute bottom-6 text-white/60 hover:text-white text-xs underline"
        @click.stop
      >
        在新窗口打开原图
      </a>
    </div>
  </Teleport>
</template>
