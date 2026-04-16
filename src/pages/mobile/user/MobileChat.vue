<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useImStore } from '@/stores/im'
import ChatPanel from '@/components/ChatPanel.vue'

const router = useRouter()
const auth = useAuthStore()
const im = useImStore()

async function ensureOpen() {
  if (!auth.peerId) return
  if (im.currentTargetId !== auth.peerId) {
    await im.openConversation(auth.peerId)
  }
}

onMounted(async () => {
  if (!im.connected && auth.rcToken) await im.connect(auth.rcToken)
  await ensureOpen()
})

watch(() => [im.connected, auth.peerId], ensureOpen)
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-[#f5f7fa]">
    <header class="h-12 bg-white flex items-center px-3 border-b">
      <button class="text-gray-500 text-lg" @click="router.back()">‹</button>
      <div class="flex-1 text-center text-sm font-medium text-gray-800">在线客服</div>
      <button class="text-xs text-brand-500" @click="router.push('/m/intro')">平台介绍</button>
    </header>
    <main class="flex-1 min-h-0">
      <ChatPanel variant="mobile" />
    </main>
  </div>
</template>
