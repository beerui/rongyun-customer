<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useImStore } from '@/stores/im'
import { useConversationsStore } from '@/stores/conversations'
import ConversationItem from '@/components/ConversationItem.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import UserInfoPanel from './UserInfoPanel.vue'
import Avatar from '@/components/Avatar.vue'

const auth = useAuthStore()
const im = useImStore()
const conv = useConversationsStore()

const keyword = ref('')

const filtered = computed(() =>
  conv.list.filter((c) => !keyword.value || c.title.includes(keyword.value)),
)

const activePeer = computed(() => {
  const id = im.currentTargetId
  const found = auth.peers.find((p) => p.id === id)
  if (found) return found
  const c = conv.list.find((x) => x.targetId === id)
  return c ? { id: c.targetId, name: c.title, avatar: c.avatar } : undefined
})

async function selectConv(targetId: string) {
  await im.openConversation(targetId)
}

onMounted(async () => {
  if (!im.connected && auth.rcToken) await im.connect(auth.rcToken)
  try {
    await conv.load()
  } catch {}
  conv.watch()
})

onUnmounted(() => {
  conv.unwatch()
})

function logout() {
  im.disconnect()
  auth.logout()
  location.href = '/agent/login'
}
</script>

<template>
  <div class="h-screen w-screen flex bg-[#f5f7fa]">
    <!-- 左侧 Sidebar -->
    <aside class="w-[64px] bg-[#1f2937] flex flex-col items-center py-4 text-white/70">
      <Avatar :src="auth.avatar" :name="auth.name || '客服'" :size="40" />
      <div class="flex-1" />
      <button class="text-xs hover:text-white" @click="logout">退出</button>
    </aside>

    <!-- 会话列表 -->
    <section class="w-[300px] bg-white flex flex-col border-r">
      <div class="px-4 py-3 border-b">
        <div class="text-sm font-semibold text-gray-800 mb-2">会话 <span class="text-xs text-gray-400 ml-1">({{ conv.list.length }})</span></div>
        <input
          v-model="keyword"
          placeholder="搜索会话"
          class="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:border-brand-500"
        />
      </div>
      <div class="flex-1 overflow-y-auto scrollbar-thin">
        <div v-if="conv.loading" class="p-6 text-center text-xs text-gray-400">加载中…</div>
        <div v-else-if="!filtered.length" class="p-6 text-center text-xs text-gray-400">暂无会话</div>
        <ConversationItem
          v-for="c in filtered"
          :key="c.targetId"
          :item="c"
          :active="c.targetId === im.currentTargetId"
          @click="selectConv(c.targetId)"
        />
      </div>
    </section>

    <!-- 中间聊天 -->
    <section class="flex-1 min-w-0 flex flex-col">
      <ChatPanel
        :title="activePeer?.name || '请选择会话'"
        :subtitle="activePeer ? `ID: ${activePeer.id}` : ''"
        variant="desktop"
      />
    </section>

    <!-- 右侧用户信息 -->
    <aside class="w-[320px]">
      <UserInfoPanel :peer="activePeer" />
    </aside>
  </div>
</template>
