<script setup lang="ts">
import Drawer from '@/components/Drawer.vue'
import { mockCoupons } from '@/utils/mock-data'
import type { CouponPayload } from '@/im/types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'send', coupon: CouponPayload): void
}>()
</script>

<template>
  <Drawer :open="props.open" title="优惠券" :width="420" @close="emit('close')">
    <div class="p-4 space-y-3">
      <div
        v-for="c in mockCoupons"
        :key="c.couponId"
        class="relative flex items-center gap-4 rounded-lg bg-gradient-to-r from-brand-50 to-white border border-brand-100 p-4"
      >
        <div class="shrink-0 w-20 text-center border-r border-dashed border-brand-300 pr-4">
          <div class="text-brand-500 text-2xl font-bold">¥{{ c.amount }}</div>
          <div class="text-[11px] text-ink-600 mt-0.5">
            {{ c.threshold ? `满${c.threshold}可用` : '无门槛' }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-ink-900">{{ c.title }}</div>
          <div class="text-[11px] text-ink-600 mt-1">有效期至 {{ c.expireAt }}</div>
        </div>
        <button class="shrink-0 h-8 px-3 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-xs" @click="emit('send', c)">
          发放
        </button>
      </div>
    </div>
  </Drawer>
</template>
