<script setup lang="ts">
import type { Conversation } from '@/im'
import Avatar from './Avatar.vue'

defineProps<{
  item: Conversation & { tag?: string; avatarBg?: string }
  active?: boolean
  timeLabel?: string
}>()

const tagColors: Record<string, { bg: string; fg: string }> = {
  供应商: { bg: '#F9ECD7', fg: '#954D00' },
  采购商: { bg: '#CCE6FF', fg: '#0A447C' },
}

function tagStyle(tag?: string) {
  if (!tag) return {}
  const c = tagColors[tag] || { bg: '#F0F0F0', fg: '#666666' }
  return { background: c.bg, color: c.fg }
}
</script>

<template>
  <div
    class="flex items-center gap-2.5 px-5 h-[70px] cursor-pointer transition-colors rounded-[8px] mb-[10px]"
    :class="active ? 'bg-[#FEF5F5]' : 'hover:bg-bg-soft'"
  >
    <!-- <Avatar :name="item.title" :size="38" :bg="item.avatarBg || '#E6F4FF'" /> -->

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-1.5 mb-1">
        <div class="text-[13px] font-semibold text-ink-900 truncate">{{ item.title }}</div>
        <span v-if="item.tag" class="shrink-0 text-[10px] px-1.5 py-0.5 rounded" :style="tagStyle(item.tag)">
          {{ item.tag }}
        </span>
      </div>
      <div class="text-[11px] text-ink-600 truncate">{{ item.lastMessage || '暂无消息' }}</div>
    </div>

    <div class="shrink-0 flex flex-col items-end gap-1 self-start pt-0.5">
      <div class="text-[11px] text-ink-600/70">{{ timeLabel || '' }}</div>
      <div
        v-if="item.unread > 0"
        class="bg-red-500 text-white text-[10px] rounded-full px-1.5 min-w-[18px] h-[16px] leading-[16px] text-center"
      >
        {{ item.unread > 99 ? '99+' : item.unread }}
      </div>
    </div>
  </div>
</template>
