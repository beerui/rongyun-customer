<script setup lang="ts">
withDefaults(defineProps<{ src?: string; name?: string; size?: number; bg?: string }>(), { size: 36 })
</script>

<template>
  <div
    class="inline-flex items-center justify-center rounded-full overflow-hidden font-medium select-none text-ink-800"
    :style="{
      width: size + 'px',
      height: size + 'px',
      fontSize: size * 0.38 + 'px',
      background: bg || '#E6F4FF',
    }"
  >
    <img v-if="src" :src="src" class="w-full h-full object-cover" alt="" />
    <span v-else>{{ (name || '?').slice(0, 1).toUpperCase() }}</span>
  </div>
</template>
