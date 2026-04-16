<script setup lang="ts">
import { ref, computed } from 'vue'
import Avatar from '@/components/Avatar.vue'
import { useImStore } from '@/stores/im'

const props = defineProps<{
  peer?: { id: string; name: string; avatar?: string }
}>()

const im = useImStore()
const tab = ref<'info' | 'ai' | 'tools'>('info')

const msgCount = computed(() => im.messages.length)

const tabs = [
  { key: 'info',  label: '用户信息' },
  { key: 'ai',    label: '智能辅助' },
  { key: 'tools', label: '工具面板' },
] as const
</script>

<template>
  <div class="h-full bg-white border-l border-line-light flex flex-col">
    <div class="flex border-b border-line-light">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="flex-1 py-3 text-xs font-medium relative transition-colors"
        :class="tab === t.key ? 'text-brand-500' : 'text-ink-600 hover:text-ink-800'"
        @click="tab = t.key"
      >
        {{ t.label }}
        <span
          v-if="tab === t.key"
          class="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-brand-500 rounded"
        />
      </button>
    </div>

    <div v-if="!peer" class="flex-1 flex items-center justify-center text-ink-600 text-sm">
      未选择会话
    </div>

    <div v-else-if="tab === 'info'" class="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
      <div class="flex flex-col items-center">
        <Avatar :src="peer.avatar" :name="peer.name" :size="64" />
        <div class="mt-3 text-sm font-semibold text-ink-900">{{ peer.name }}</div>
        <div class="text-[11px] text-ink-600 mt-1">ID: {{ peer.id }}</div>
        <span class="mt-2 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-success-50 text-success-500">
          <span class="w-1.5 h-1.5 rounded-full bg-success-500" />在线
        </span>
      </div>

      <div class="rounded-lg bg-bg-app p-3 text-xs text-ink-700 space-y-2">
        <div class="flex justify-between"><span class="text-ink-600">本次消息数</span><span class="font-medium">{{ msgCount }}</span></div>
        <div class="flex justify-between"><span class="text-ink-600">来源</span><span>Web</span></div>
        <div class="flex justify-between"><span class="text-ink-600">会员等级</span><span class="text-brand-600">VIP3</span></div>
        <div class="flex justify-between"><span class="text-ink-600">累计订单</span><span>18 笔</span></div>
      </div>

      <div>
        <div class="text-xs font-medium text-ink-800 mb-2">最近订单</div>
        <div class="rounded-lg border border-line-light p-3 text-xs space-y-1">
          <div class="flex justify-between"><span class="text-ink-600">订单号</span><span class="text-ink-900">#20260417-089</span></div>
          <div class="flex justify-between"><span class="text-ink-600">金额</span><span class="text-brand-600">¥ 298.00</span></div>
          <div class="flex justify-between"><span class="text-ink-600">状态</span><span class="text-warn-700">待发货</span></div>
        </div>
      </div>
    </div>

    <div v-else-if="tab === 'ai'" class="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-3">
      <div class="rounded-lg bg-gradient-to-br from-brand-50 to-white border border-brand-100 p-3 text-xs text-ink-700">
        <div class="text-brand-600 font-medium mb-1">✨ 意图识别</div>
        <div>用户可能想咨询：订单物流 / 退换货</div>
      </div>
      <div class="text-xs font-medium text-ink-800">推荐回复</div>
      <button class="w-full text-left text-xs text-ink-700 rounded-md border border-line-light hover:border-brand-500 hover:bg-brand-50 p-2.5">
        您好，您的订单正在派送中，预计今日送达。
      </button>
      <button class="w-full text-left text-xs text-ink-700 rounded-md border border-line-light hover:border-brand-500 hover:bg-brand-50 p-2.5">
        请问需要我帮您查询最新物流信息吗？
      </button>
    </div>

    <div v-else class="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-2">
      <div class="text-xs font-medium text-ink-800 mb-2">快捷工具</div>
      <div class="grid grid-cols-2 gap-2">
        <button class="rounded-md border border-line-light p-3 text-xs hover:border-brand-500 hover:text-brand-600">🎟️ 发放优惠券</button>
        <button class="rounded-md border border-line-light p-3 text-xs hover:border-brand-500 hover:text-brand-600">📦 查询订单</button>
        <button class="rounded-md border border-line-light p-3 text-xs hover:border-brand-500 hover:text-brand-600">🚚 物流追踪</button>
        <button class="rounded-md border border-line-light p-3 text-xs hover:border-brand-500 hover:text-brand-600">🔁 退换货</button>
      </div>
    </div>
  </div>
</template>
