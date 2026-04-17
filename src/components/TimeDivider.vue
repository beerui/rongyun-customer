<script setup lang="ts">
defineProps<{ ts: number }>()

function format(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (sameDay) return hm
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `昨天 ${hm}`
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  if (now.getTime() - ts < oneWeek) {
    const names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${names[d.getDay()]} ${hm}`
  }
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`
}
</script>

<template>
  <div class="text-center my-3 text-[11px] text-ink-600">
    <span class="px-2 py-0.5 rounded bg-bg-soft">{{ format(ts) }}</span>
  </div>
</template>
