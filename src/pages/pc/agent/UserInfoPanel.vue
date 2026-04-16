<script setup lang="ts">
import { ref } from 'vue'
import Avatar from '@/components/Avatar.vue'
import { useComposerStore } from '@/stores/composer'
import { useImStore } from '@/stores/im'

defineProps<{
  peer?: { id: string; name: string; avatar?: string; avatarBg?: string; tag?: string }
}>()

const emit = defineEmits<{
  (e: 'open-drawer', kind: 'order' | 'product' | 'coupon' | 'quick'): void
}>()

const composer = useComposerStore()
const im = useImStore()
const tab = ref<'info' | 'ai' | 'tools'>('info')
const editingUser = ref(false)

const tabs = [
  { key: 'info',  label: '用户信息' },
  { key: 'ai',    label: '智能辅助' },
  { key: 'tools', label: '工具面板' },
] as const

const infoRows = ref([
  { k: '手机号',   v: '182****2245' },
  { k: '注册时间', v: '2021-10-22' },
  { k: '所在城市', v: '上海市徐汇区' },
  { k: '历史订单', v: '23笔' },
  { k: '累计消费', v: '¥53,432' },
  { k: '投诉记录', v: '10次' },
  { k: '来源渠道', v: 'APP-iOS16' },
])

const tags = [
  { label: '活跃用户', bg: '#F6EEFF', fg: '#5B21B6' },
  { label: '高投诉',   bg: '#F6E1E1', fg: '#802A2A' },
  { label: '理性消费', bg: '#DCFFF3', fg: '#1B9E75' },
]

const bars = [
  { label: '物流问题', pct: 45, color: '#1B9E75' },
  { label: '商品咨询', pct: 30, color: '#1890FF' },
  { label: '退货退款', pct: 15, color: '#FAAD14' },
  { label: '账户问题', pct: 10, color: '#EB2F96' },
]

const aiSuggestions = [
  '您好，您的订单正在派送中，预计今日送达。',
  '请问需要我帮您查询最新物流信息吗？',
  '已为您登记，客服稍后将通过电话与您联系。',
  '感谢您的耐心等待，祝您生活愉快！',
]

function fillInput(t: string) {
  composer.insert(t)
}
function sendNow(t: string) {
  im.sendTextMessage(t)
}
</script>

<template>
  <div class="h-full bg-white border-l border-line-light flex flex-col">
    <div class="flex items-center h-12 px-5 gap-7 border-b border-line-light">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="relative text-[13px] font-medium transition-colors h-full"
        :class="tab === t.key ? 'text-ink-900' : 'text-ink-600 hover:text-ink-800'"
        @click="tab = t.key"
      >
        {{ t.label }}
        <span
          v-if="tab === t.key"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500"
        />
      </button>
    </div>

    <div v-if="!peer" class="flex-1 flex items-center justify-center text-ink-600 text-sm">
      未选择会话
    </div>

    <div v-else-if="tab === 'info'" class="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
      <div class="rounded-lg bg-bg-app p-4">
        <div class="text-[13px] font-semibold text-ink-900 mb-3">用户基本信息</div>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2.5">
            <Avatar :name="peer.name" :size="38" :bg="peer.avatarBg || '#E8FFEA'" />
            <div class="text-sm text-ink-800">{{ peer.name }}</div>
          </div>
          <button
            class="text-xs text-brand-500 hover:text-brand-600"
            @click="editingUser = !editingUser"
          >{{ editingUser ? '完成' : '编辑' }}</button>
        </div>
        <div class="space-y-2.5">
          <div v-for="r in infoRows" :key="r.k" class="flex justify-between items-center text-xs">
            <span class="text-ink-600">{{ r.k }}</span>
            <input
              v-if="editingUser"
              v-model="r.v"
              class="text-right border-b border-line-light focus:outline-none focus:border-brand-500 text-ink-900 bg-transparent"
              :style="{ maxWidth: '140px' }"
            />
            <span v-else class="text-ink-900">{{ r.v }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-bg-app p-4">
        <div class="text-[13px] font-semibold text-ink-900 mb-3">用户画像</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="t in tags"
            :key="t.label"
            class="text-[11px] px-2 py-0.5 rounded"
            :style="{ background: t.bg, color: t.fg }"
          >{{ t.label }}</span>
        </div>
      </div>

      <div class="rounded-lg bg-bg-app p-4">
        <div class="text-[13px] font-semibold text-ink-900 mb-3">问题分布</div>
        <div class="space-y-4">
          <div v-for="b in bars" :key="b.label">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-ink-800 font-medium">{{ b.label }}</span>
              <span class="text-ink-800 font-medium">{{ b.pct }}%</span>
            </div>
            <div class="h-1 rounded-full bg-line-light overflow-hidden">
              <div class="h-full rounded-full" :style="{ width: b.pct + '%', background: b.color }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="tab === 'ai'" class="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
      <div class="rounded-lg bg-gradient-to-br from-brand-50 to-white border border-brand-100 p-3 text-xs text-ink-700">
        <div class="text-brand-600 font-medium mb-1">✨ 意图识别</div>
        <div>用户可能想咨询：订单物流 / 退换货</div>
      </div>
      <div class="text-xs font-medium text-ink-800 mb-1">推荐回复（点击填入输入框，或直接发送）</div>
      <div
        v-for="(t, i) in aiSuggestions"
        :key="i"
        class="rounded-md border border-line-light p-2.5 hover:border-brand-500"
      >
        <div class="text-xs text-ink-700 leading-relaxed mb-2">{{ t }}</div>
        <div class="flex items-center justify-end gap-2">
          <button class="text-[11px] text-ink-600 hover:text-brand-500" @click="fillInput(t)">填入</button>
          <button class="h-6 px-2 rounded bg-brand-500 hover:bg-brand-600 text-white text-[11px]" @click="sendNow(t)">发送</button>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 overflow-y-auto scrollbar-thin p-4">
      <div class="text-xs font-medium text-ink-800 mb-2">快捷工具</div>
      <div class="grid grid-cols-2 gap-2">
        <button
          class="rounded-md border border-line-light p-3 text-xs hover:border-brand-500 hover:text-brand-600"
          @click="emit('open-drawer', 'coupon')"
        >🎟️ 发放优惠券</button>
        <button
          class="rounded-md border border-line-light p-3 text-xs hover:border-brand-500 hover:text-brand-600"
          @click="emit('open-drawer', 'order')"
        >📦 查询订单</button>
        <button
          class="rounded-md border border-line-light p-3 text-xs hover:border-brand-500 hover:text-brand-600"
          @click="emit('open-drawer', 'product')"
        >🛍️ 商品列表</button>
        <button
          class="rounded-md border border-line-light p-3 text-xs hover:border-brand-500 hover:text-brand-600"
          @click="emit('open-drawer', 'quick')"
        >⚡ 快捷话术</button>
      </div>
    </div>
  </div>
</template>
