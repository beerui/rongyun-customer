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
  if (!im.connected && auth.rcToken) await im.connect(auth.rcToken)
  await ensureOpen()
})

watch(() => [im.connected, auth.peerId], ensureOpen)
</script>

<template>
  <div class="h-screen w-screen flex bg-[#f5f7fa]">
    <!-- 左侧聊天窗（隐藏分组列表，仅单会话） -->
    <aside class="w-[380px] border-r bg-white flex flex-col">
      <ChatPanel
        title="在线客服"
        subtitle="平台客服为您服务"
        variant="desktop"
      />
    </aside>

    <!-- 右侧平台介绍 -->
    <main class="flex-1 min-w-0">
      <PlatformIntro />
    </main>
  </div>
</template>
