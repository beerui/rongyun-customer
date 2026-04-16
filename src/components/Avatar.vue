<script setup lang="ts">
defineProps<{ src?: string; name?: string; size?: number }>()
</script>

<template>
  <div
    class="inline-flex items-center justify-center rounded-full overflow-hidden bg-brand-100 text-brand-700 font-medium select-none"
    :style="{ width: (size ?? 36) + 'px', height: (size ?? 36) + 'px', fontSize: ((size ?? 36) * 0.4) + 'px' }"
  >
    <img v-if="src" :src="src" class="w-full h-full object-cover" alt="" />
    <span v-else>{{ (name || '?').slice(0, 1).toUpperCase() }}</span>
  </div>
</template>
