<script setup lang="ts">
import { computed, ref } from 'vue'
import Drawer from '@/components/Drawer.vue'
import { mockProducts } from '@/utils/mock-data'
import type { ProductPayload } from '@/im/types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'send', product: ProductPayload): void
}>()

const keyword = ref('')
const filtered = computed(() => mockProducts.filter((p) => !keyword.value || p.title.includes(keyword.value)))

function send(p: ProductPayload) {
  emit('send', p)
}
</script>

<template>
  <Drawer :open="props.open" title="商品列表" :width="480" @close="emit('close')">
    <div class="px-5 py-3 border-b border-line-light">
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600 text-xs">🔍</span>
        <input
          v-model="keyword"
          placeholder="搜索商品名"
          class="w-full h-8 rounded bg-bg-app border border-transparent pl-8 pr-3 text-xs focus:outline-none focus:border-brand-500 focus:bg-white"
        />
      </div>
    </div>
    <div class="p-4 space-y-3">
      <div v-for="p in filtered" :key="p.productId" class="flex gap-3 rounded-lg border border-line-light p-3 hover:border-brand-500">
        <img :src="p.cover" class="w-20 h-20 rounded object-cover shrink-0" alt="" />
        <div class="flex-1 min-w-0">
          <div class="text-sm text-ink-900 line-clamp-2">{{ p.title }}</div>
          <div class="text-[11px] text-ink-600 mt-1">{{ p.spec }}</div>
          <div class="mt-1.5 flex items-center gap-2">
            <span class="text-brand-500 font-semibold text-sm">¥ {{ p.price }}</span>
            <span v-if="p.originPrice" class="text-[11px] text-ink-600 line-through">¥ {{ p.originPrice }}</span>
          </div>
        </div>
        <div class="shrink-0 flex items-center">
          <button class="h-8 px-3 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-xs" @click="send(p)">发送卡片</button>
        </div>
      </div>
    </div>
  </Drawer>
</template>
