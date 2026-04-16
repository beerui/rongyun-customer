<script setup lang="ts">
defineProps<{ title?: string; desc?: string }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-gray-400">
    <div class="text-4xl mb-3">💬</div>
    <div class="text-base">{{ title || '暂无内容' }}</div>
    <div v-if="desc" class="text-xs mt-1">{{ desc }}</div>
  </div>
</template>
