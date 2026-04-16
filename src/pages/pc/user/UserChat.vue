<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useImStore } from '@/stores/im'
import ChatPanel from '@/components/ChatPanel.vue'
import PlatformIntro from './PlatformIntro.vue'

const auth = useAuthStore()
const im = useImStore()

async function ensureOpen() {
  if (!auth.peerId) return
  if (im.currentTargetId !== auth.peerId) {
    await im.openConversation(auth.peerId)
  }
}

onMounted(async () => {
  // 访客端：进入时获取 IM 凭证（若未获取）
  if (auth.role === 'guest' || !auth.rcToken) {
    try { await auth.bootstrapUser() } catch (e) { console.warn('bootstrapUser failed', e) }
  }
  if (auth.rcToken && !im.connected) {
    im.connect(auth.rcToken).catch((e) => console.warn('RC connect failed:', e))
  }
  await ensureOpen()
})

watch(() => [im.connected, auth.peerId], ensureOpen)
</script>

<template>
  <div class="h-screen w-screen flex bg-bg-app">
    <aside class="w-[380px] border-r border-line-light bg-white flex flex-col">
      <ChatPanel
        title="在线客服"
        subtitle="平台客服为您服务"
        variant="desktop"
        :show-start="true"
        start-time="今天"
      />
    </aside>
    <main class="flex-1 min-w-0">
      <PlatformIntro />
    </main>
  </div>
</template>
