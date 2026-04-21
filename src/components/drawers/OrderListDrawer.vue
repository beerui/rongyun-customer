<script setup lang="ts">
import { computed } from 'vue'
import Drawer from '@/components/Drawer.vue'
import { mockOrdersFor } from '@/utils/mock-data'
import type { OrderPayload, ProductPayload } from '@/im/types'

const props = defineProps<{ open: boolean; userId: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'send-order', order: OrderPayload): void
  (e: 'send-product', product: ProductPayload): void
}>()

const orders = computed(() => mockOrdersFor(props.userId || 'anon'))

function statusColor(s: string) {
  if (s === '待发货') return 'bg-[#FFF7E8] text-[#D25F00]'
  if (s === '已发货') return 'bg-[#E6F4FF] text-[#1677FF]'
  if (s === '已完成') return 'bg-[#E8FFEA] text-[#00B42A]'
  return 'bg-[#F0F0F0] text-ink-700'
}

function productFromItem(o: OrderPayload, i: number): ProductPayload {
  const it = o.items[i]
  return {
    productId: `${o.orderId}-item-${i}`,
    title: it.title,
    cover: it.cover,
    price: it.price,
    spec: `数量 ×${it.qty}`,
    url: `https://example.com/order/${o.orderId}`,
  }
}
</script>

<template>
  <Drawer :open="props.open" title="订单列表" :width="480" @close="emit('close')">
    <div v-if="!orders.length" class="text-center py-10 text-xs text-ink-600">该用户暂无订单</div>

    <div v-else class="p-4 space-y-3">
      <div v-for="o in orders" :key="o.orderId" class="rounded-lg border border-line-light">
        <div class="flex items-center justify-between px-3 pt-3">
          <div class="text-[11px] text-ink-600">
            <span class="mr-2">{{ o.orderId }}</span>
            <span>{{ o.createdAt }}</span>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded" :class="statusColor(o.status)">
            {{ o.status }}
          </span>
        </div>

        <div class="px-3 py-2 space-y-2">
          <div v-for="(it, i) in o.items" :key="i" class="flex items-center gap-2">
            <img :src="it.cover" class="w-10 h-10 rounded object-cover shrink-0" alt="" />
            <div class="flex-1 min-w-0">
              <div class="text-xs text-ink-800 truncate">{{ it.title }}</div>
              <div class="text-[11px] text-ink-600">¥ {{ it.price }} × {{ it.qty }}</div>
            </div>
            <button
              class="shrink-0 text-[11px] text-brand-500 hover:text-brand-600 hover:underline"
              @click="emit('send-product', productFromItem(o, i))"
            >
              发送此商品
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-line-light px-3 py-2 bg-bg-app rounded-b-lg">
          <div class="text-[11px] text-ink-600">
            合计
            <span class="text-brand-500 font-semibold text-sm">¥ {{ o.totalAmount }}</span>
          </div>
          <button class="h-7 px-3 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-[11px]" @click="emit('send-order', o)">
            发送订单卡片
          </button>
        </div>
      </div>
    </div>
  </Drawer>
</template>
