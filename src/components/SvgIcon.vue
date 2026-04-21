<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    class?: string
  }>(),
  {
    class: 'w-4 h-4',
  },
)

const iconModules = import.meta.glob('@/assets/icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const svgContent = computed(() => {
  const normalizedName = props.name.replace(/\.svg$/i, '')
  const path = Object.keys(iconModules).find((key) =>
    key.endsWith(`/assets/icons/${normalizedName}.svg`),
  )

  return path ? iconModules[path] : ''
})
</script>

<template>
  <span
    v-if="svgContent"
    class="inline-flex items-center justify-center"
    :class="props.class"
    v-html="svgContent"
  />
  <span
    v-else
    class="inline-flex items-center justify-center text-[10px] text-[#ff4d4f]"
    :class="props.class"
    :title="`icon not found: ${props.name}`"
  >
    ?
  </span>
</template>