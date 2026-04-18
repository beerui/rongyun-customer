import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 图片查看器全局状态。调用方：
 *   const lb = useLightboxStore()
 *   lb.open(url, allUrls)   // 指定当前 url + 同组图片列表
 *   lb.open(url)            // 只传当前 url，自动只看这一张
 */
export const useLightboxStore = defineStore('lightbox', () => {
  const urls = ref<string[]>([])
  const index = ref(0)
  const isOpen = computed(() => urls.value.length > 0)
  const current = computed(() => urls.value[index.value] ?? '')
  const hasPrev = computed(() => index.value > 0)
  const hasNext = computed(() => index.value < urls.value.length - 1)

  function open(url: string, list?: string[]) {
    const arr = list && list.length ? list : [url]
    const i = Math.max(0, arr.indexOf(url))
    urls.value = arr
    index.value = i
  }

  function close() {
    urls.value = []
    index.value = 0
  }

  function prev() {
    if (hasPrev.value) index.value -= 1
  }

  function next() {
    if (hasNext.value) index.value += 1
  }

  return { urls, index, isOpen, current, hasPrev, hasNext, open, close, prev, next }
})
