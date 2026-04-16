<script setup lang="ts">
import Drawer from '@/components/Drawer.vue'
import { quickReplies } from '@/utils/mock-data'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'pick', text: string): void
  (e: 'send', text: string): void
}>()
</script>

<template>
  <Drawer :open="props.open" title="快捷话术" :width="400" @close="emit('close')">
    <div class="p-4 space-y-2">
      <div
        v-for="(t, i) in quickReplies"
        :key="i"
        class="rounded-md border border-line-light p-3 hover:border-brand-500"
      >
        <div class="text-sm text-ink-800 leading-relaxed mb-2">{{ t }}</div>
        <div class="flex items-center justify-end gap-2">
          <button
            class="h-7 px-3 rounded border border-line-light text-[11px] text-ink-700 hover:border-brand-500 hover:text-brand-500"
            @click="emit('pick', t)"
          >填入输入框</button>
          <button
            class="h-7 px-3 rounded bg-brand-500 hover:bg-brand-600 text-white text-[11px]"
            @click="emit('send', t)"
          >立即发送</button>
        </div>
      </div>
    </div>
  </Drawer>
</template>
