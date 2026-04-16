<script setup lang="ts">
import type { Conversation } from '@/im'
import Avatar from './Avatar.vue'

defineProps<{
  item: Conversation & { tag?: string; avatarBg?: string }
  active?: boolean
  timeLabel?: string
}>()

const tagColors: Record<string, { bg: string; fg: string }> = {
  '退款申请': { bg: '#F9ECD7', fg: '#954D00' },
  '物流异常': { bg: '#CCE6FF', fg: '#0A447C' },
  '物流查询': { bg: '#E1F6EF', fg: '#3A7467' },
  '商品咨询': { bg: '#DCDCDC', fg: '#333333' },
  '账户异常': { bg: '#FFE1E1', fg: '#802A2A' },
  '优惠问题': { bg: '#E7D3FF', fg: '#5B21B6' },
}

function tagStyle(tag?: string) {
  if (!tag) return {}
  const c = tagColors[tag] || { bg: '#F0F0F0', fg: '#666666' }
  return { background: c.bg, color: c.fg }
}
</script>

<template>
  <div
    class="flex items-center gap-2.5 px-5 h-[70px] cursor-pointer transition-colors"
    :class="active ? 'bg-[#FEF5F5]' : 'hover:bg-bg-soft'"
  >
    <Avatar :name="item.title" :size="38" :bg="item.avatarBg || '#E6F4FF'" />

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1.5 mb-1">
        <div class="text-[13px] font-semibold text-ink-900 truncate">{{ item.title }}</div>
        <span
          v-if="item.tag"
          class="shrink-0 text-[10px] px-1.5 py-0.5 rounded"
          :style="tagStyle(item.tag)"
        >{{ item.tag }}</span>
      </div>
      <div class="text-[11px] text-ink-600 truncate">{{ item.lastMessage || '暂无消息' }}</div>
    </div>

    <div class="shrink-0 text-[11px] text-ink-600/70 self-start pt-0.5">
      {{ timeLabel || '' }}
    </div>
  </div>
</template>
