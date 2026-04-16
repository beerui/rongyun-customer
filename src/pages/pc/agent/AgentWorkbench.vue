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
const filterKey = ref<'all' | 'vip' | 'new'>('all')

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

const stats = computed(() => ({
  today: 23,
  satisfaction: '99.6%',
  avgDuration: '4m12s',
  solveRate: '91.6%',
}))

async function selectConv(targetId: string) {
  await im.openConversation(targetId)
}

onMounted(async () => {
  if (!im.connected && auth.rcToken) await im.connect(auth.rcToken)
  try { await conv.load() } catch {}
  conv.watch()
})

onUnmounted(() => { conv.unwatch() })

function logout() {
  im.disconnect()
  auth.logout()
  location.href = '/agent/login'
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-bg-app">
    <!-- 顶部栏：统计 + 标题 + 客服身份 -->
    <header class="h-14 bg-white border-b border-line-light flex items-center px-6 shrink-0">
      <div class="text-[18px] font-semibold text-ink-900">智能客服工作台</div>

      <div class="flex items-center gap-6 ml-10">
        <div class="text-xs">
          <span class="text-ink-600">今天接待</span>
          <span class="ml-1.5 text-sm font-semibold text-ink-900">{{ stats.today }}</span>
        </div>
        <div class="text-xs">
          <span class="text-ink-600">满意度</span>
          <span class="ml-1.5 text-sm font-semibold text-success-500">{{ stats.satisfaction }}</span>
        </div>
        <div class="text-xs">
          <span class="text-ink-600">平均时长</span>
          <span class="ml-1.5 text-sm font-semibold text-ink-900">{{ stats.avgDuration }}</span>
        </div>
        <div class="text-xs">
          <span class="text-ink-600">解决率</span>
          <span class="ml-1.5 text-sm font-semibold text-brand-500">{{ stats.solveRate }}</span>
        </div>
      </div>

      <div class="flex-1" />

      <div class="flex items-center gap-3">
        <div class="text-right">
          <div class="text-xs text-ink-600">在线客服</div>
          <div class="text-sm font-medium text-ink-900">{{ auth.name || '小赵' }}</div>
        </div>
        <Avatar :src="auth.avatar" :name="auth.name || '小赵'" :size="36" />
        <button class="text-xs text-ink-600 hover:text-brand-500 ml-2" @click="logout">退出</button>
      </div>
    </header>

    <div class="flex-1 flex min-h-0">
      <!-- 会话列表 -->
      <section class="w-[300px] bg-white flex flex-col border-r border-line-light shrink-0">
        <div class="px-4 pt-4 pb-3">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm font-semibold text-ink-900">待处理用户</div>
            <span class="text-[11px] text-ink-600">共 {{ filtered.length }}</span>
          </div>

          <div class="flex gap-1.5 mb-3">
            <button
              v-for="f in [{k:'all',l:'全部'},{k:'vip',l:'VIP'},{k:'new',l:'新会话'}]"
              :key="f.k"
              class="text-[11px] px-2.5 py-1 rounded-full transition-colors"
              :class="filterKey === f.k
                ? 'bg-brand-500 text-white'
                : 'bg-bg-soft text-ink-700 hover:bg-line-light'"
              @click="filterKey = f.k as any"
            >{{ f.l }}</button>
          </div>

          <div class="relative">
            <input
              v-model="keyword"
              placeholder="搜索用户名/订单号"
              class="w-full rounded-md bg-bg-app border border-transparent px-8 py-1.5 text-xs focus:outline-none focus:border-brand-500 focus:bg-white"
            />
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-600 text-xs">🔍</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto scrollbar-thin border-t border-line-light">
          <div v-if="conv.loading" class="p-8 text-center text-xs text-ink-600">加载中…</div>
          <div v-else-if="!filtered.length" class="p-8 text-center text-xs text-ink-600">暂无会话</div>
          <ConversationItem
            v-for="c in filtered"
            :key="c.targetId"
            :item="c"
            :active="c.targetId === im.currentTargetId"
            @click="selectConv(c.targetId)"
          />
        </div>
      </section>

      <!-- 中间聊天区 -->
      <section class="flex-1 min-w-0 flex flex-col">
        <ChatPanel
          :title="activePeer?.name || '请选择会话'"
          :subtitle="activePeer ? `用户 ID: ${activePeer.id}` : ''"
          variant="desktop"
          :show-start="!!activePeer"
          start-time="今天 12:32"
          ai-suggestion="您好！您的订单已在配送中，请耐心等候。需要我帮您查询实时物流吗？"
        />
      </section>

      <!-- 右侧用户信息 -->
      <aside class="w-[320px] shrink-0">
        <UserInfoPanel :peer="activePeer" />
      </aside>
    </div>
  </div>
</template>
