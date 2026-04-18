<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

function iconFor(kind: string) {
  if (kind === 'success') return '✓'
  if (kind === 'error') return '!'
  if (kind === 'warning') return '!'
  return 'i'
}

function bgFor(kind: string) {
  if (kind === 'success') return 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
  if (kind === 'error') return 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
  if (kind === 'warning') return 'bg-[#FFFBEB] border-[#FCD34D] text-[#92400E]'
  return 'bg-[#EFF6FF] border-[#93C5FD] text-[#1E40AF]'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-2 pointer-events-none">
      <transition-group name="toast" tag="div" class="flex flex-col gap-2 items-center">
        <div
          v-for="it in toast.items"
          :key="it.id"
          class="pointer-events-auto flex items-center gap-2 min-w-[220px] max-w-[480px] px-4 py-2.5 rounded-lg border shadow-md text-[13px]"
          :class="bgFor(it.kind)"
          role="status"
        >
          <span
            class="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold bg-white/60"
          >{{ iconFor(it.kind) }}</span>
          <span class="flex-1 whitespace-pre-wrap break-words">{{ it.message }}</span>
          <button
            class="text-current/60 hover:text-current text-base leading-none ml-1"
            @click="toast.dismiss(it.id)"
            title="关闭"
          >×</button>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-6px); }
.toast-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>
