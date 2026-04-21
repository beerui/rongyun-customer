<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  width?: number
}>()

defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="fixed inset-0 bg-black/35 z-40" @click="$emit('close')" />
    </transition>
    <transition name="slide-right">
      <aside
        v-if="open"
        class="fixed top-0 right-0 bottom-0 bg-white shadow-card flex flex-col z-50"
        :style="{ width: (width ?? 420) + 'px' }"
      >
        <div class="h-12 px-5 flex items-center justify-between border-b border-line-light shrink-0">
          <div class="text-sm font-semibold text-ink-900">{{ title }}</div>
          <button class="text-ink-600 hover:text-ink-900 text-base" @click="$emit('close')">✕</button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          <slot />
        </div>
        <div v-if="$slots.footer" class="border-t border-line-light px-5 py-3 shrink-0">
          <slot name="footer" />
        </div>
      </aside>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.24s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
