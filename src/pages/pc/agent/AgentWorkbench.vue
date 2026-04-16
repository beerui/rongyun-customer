<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useImStore } from '@/stores/im'
import { useConversationsStore } from '@/stores/conversations'
import ConversationItem from '@/components/ConversationItem.vue'
import MessageList from '@/components/MessageList.vue'
import MessageInput from '@/components/MessageInput.vue'
import UserInfoPanel from './UserInfoPanel.vue'
import Avatar from '@/components/Avatar.vue'
import EmptyState from '@/components/EmptyState.vue'

const auth = useAuthStore()
const im = useImStore()
const conv = useConversationsStore()

const keyword = ref('')
const filterKey = ref<'all' | 'waiting' | 'active'>('all')

// demo 数据：在无后端时用来对照设计稿
const demoConvs = [
  { targetId: 'u_wen',  title: '温温', avatarBg: '#E8FFEA', tag: '退款申请', lastMessage: '我要申请退货退款.......', timeLabel: '5分钟',  active: true  },
  { targetId: 'u_zs',   title: '张三', avatarBg: '#FFF7E8', tag: '物流异常', lastMessage: '我一直没收到货啊......',    timeLabel: '12分钟' },
  { targetId: 'u_ls',   title: '李四', avatarBg: '#FFECE8', tag: '物流查询', lastMessage: '我的快递到哪里了？',        timeLabel: '30分钟' },
  { targetId: 'u_wq1',  title: '王强', avatarBg: '#E6F4FF', tag: '商品咨询', lastMessage: '这个有没有红色的？',        timeLabel: '45分钟' },
  { targetId: 'u_wq2',  title: '王强', avatarBg: '#E6F4FF', tag: '商品咨询', lastMessage: '这个有没有红色的？',        timeLabel: '45分钟' },
  { targetId: 'u_wq3',  title: '王强', avatarBg: '#E6F4FF', tag: '物流查询', lastMessage: '这个有没有红色的？',        timeLabel: '45分钟' },
  { targetId: 'u_wq4',  title: '王强', avatarBg: '#E6F4FF', tag: '账户异常', lastMessage: '这个有没有红色的？',        timeLabel: '45分钟' },
  { targetId: 'u_wq5',  title: '王强', avatarBg: '#E6F4FF', tag: '优惠问题', lastMessage: '这个有没有红色的？',        timeLabel: '45分钟' },
]

const filtered = computed(() => {
  const base = conv.list.length ? conv.list.map((c, i) => ({
    ...c,
    tag: (demoConvs[i % demoConvs.length] as any).tag,
    avatarBg: (demoConvs[i % demoConvs.length] as any).avatarBg,
    timeLabel: '',
  })) : demoConvs.map((c) => ({ ...c, unread: 0, lastTime: 0 } as any))
  return base.filter((c: any) => !keyword.value || c.title.includes(keyword.value))
})

const activePeer = computed(() => {
  const id = im.currentTargetId || filtered.value[0]?.targetId
  const c: any = filtered.value.find((x: any) => x.targetId === id)
  return c ? { id: c.targetId, name: c.title, avatar: c.avatar, avatarBg: c.avatarBg, tag: c.tag } : undefined
})

const stats = {
  today: '23',
  satisfaction: '99.6%',
  avgDuration: '4m12s',
  solveRate: '91.6%',
}

async function selectConv(targetId: string) {
  await im.openConversation(targetId)
}

onMounted(async () => {
  if (!im.connected && auth.rcToken) await im.connect(auth.rcToken)
  try { await conv.load() } catch {}
  conv.watch()
})

onUnmounted(() => { conv.unwatch() })

function handleSendText(t: string) { im.sendTextMessage(t) }
function handleSendImage(f: File) { im.sendImageMessage(URL.createObjectURL(f)) }

function logout() {
  im.disconnect()
  auth.logout()
  location.href = '/agent/login'
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-bg-app min-w-[1280px]">
    <!-- 顶部红色栏 -->
    <header class="h-20 bg-brand-500 flex items-center px-5 shrink-0 text-white">
      <div class="text-[20px] font-semibold">智能客服工作台</div>
      <div class="flex items-center gap-1.5 ml-8 text-[14px]">
        <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/25">
          <span class="block w-2 h-2 rounded-full bg-white"></span>
        </span>
        <span>在线客服：{{ auth.name || '小赵' }}</span>
      </div>
      <div class="flex-1" />
      <div class="flex items-center gap-8 text-[14px]">
        <div>今天接待 <span class="font-semibold">{{ stats.today }}</span></div>
        <div>满意度 <span class="font-semibold">{{ stats.satisfaction }}</span></div>
        <div>平均时长 <span class="font-semibold">{{ stats.avgDuration }}</span></div>
        <div>解决率 <span class="font-semibold">{{ stats.solveRate }}</span></div>
      </div>
      <button class="ml-6 text-xs text-white/80 hover:text-white" @click="logout">退出</button>
    </header>

    <div class="flex-1 flex min-h-0">
      <!-- 左侧：会话列表 -->
      <section class="w-[268px] bg-white flex flex-col border-r border-line-light shrink-0">
        <div class="px-5 pt-5 pb-3">
          <div class="flex items-center gap-2 mb-3">
            <div class="text-base font-semibold text-ink-900">待处理用户</div>
            <span class="text-[11px] px-1.5 py-0.5 rounded" style="background:#F9ECD7;color:#954D00">
              {{ filtered.length }}条待处理
            </span>
          </div>

          <div class="flex gap-2 mb-3">
            <button
              v-for="f in [{k:'all',l:'全部'},{k:'waiting',l:'待接入'},{k:'active',l:'进行中'}]"
              :key="f.k"
              class="text-[13px] px-4 h-8 rounded transition-colors"
              :class="filterKey === f.k
                ? 'bg-brand-500 text-white'
                : 'bg-bg-soft text-ink-700 hover:bg-line-light'"
              @click="filterKey = f.k as any"
            >{{ f.l }}</button>
          </div>

          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600 text-xs">🔍</span>
            <input
              v-model="keyword"
              placeholder="搜索用户名/订单号"
              class="w-full h-8 rounded bg-bg-app border border-transparent pl-8 pr-3 text-xs focus:outline-none focus:border-brand-500 focus:bg-white"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto scrollbar-thin">
          <ConversationItem
            v-for="c in filtered"
            :key="c.targetId"
            :item="c as any"
            :active="(c as any).active ?? (c.targetId === im.currentTargetId)"
            :time-label="(c as any).timeLabel"
            @click="selectConv(c.targetId)"
          />
        </div>
      </section>

      <!-- 中间：聊天区 -->
      <section class="flex-1 min-w-0 flex flex-col bg-white">
        <!-- 会话头（当前用户信息 + 操作） -->
        <div v-if="activePeer" class="flex items-center justify-between px-6 h-16 border-b border-line-light shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <Avatar :name="activePeer.name" :size="38" :bg="activePeer.avatarBg || '#E8FFEA'" />
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <div class="text-base font-semibold text-ink-900 truncate">{{ activePeer.name }}</div>
                <span
                  v-if="activePeer.tag"
                  class="shrink-0 text-[10px] px-1.5 py-0.5 rounded"
                  style="background:#F9ECD7;color:#954D00"
                >{{ activePeer.tag }}</span>
              </div>
              <div class="text-[12px] text-ink-600 mt-0.5">会话已进行 8分12秒 · 2025-12-26 12:54:43 · 上海市</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="h-8 px-3 rounded border border-line-light text-xs text-ink-700 hover:border-brand-500 hover:text-brand-500">转接</button>
            <button class="h-8 px-3 rounded border border-line-light text-xs text-ink-700 hover:border-brand-500 hover:text-brand-500">挂起</button>
            <button class="h-8 px-3 rounded bg-brand-500 hover:bg-brand-600 text-white text-xs">结束会话</button>
          </div>
        </div>

        <div v-if="!activePeer" class="flex-1 flex items-center justify-center bg-bg-app">
          <EmptyState title="选择一个会话开始聊天" />
        </div>
        <template v-else>
          <!-- 消息区 -->
          <div class="flex-1 min-h-0 flex flex-col">
            <div class="text-center py-3 text-[11px] text-ink-600 bg-white shrink-0">
              今天 12:32 会话开始
            </div>
            <MessageList
              :messages="im.messages"
              :my-user-id="auth.userId"
              @retry="() => {}"
            />
          </div>

          <MessageInput
            variant="desktop"
            :disabled="!im.connected"
            @send-text="handleSendText"
            @send-image="handleSendImage"
          />
        </template>
      </section>

      <!-- 右侧：用户信息面板 -->
      <aside class="w-[300px] shrink-0">
        <UserInfoPanel :peer="activePeer" />
      </aside>
    </div>
  </div>
</template>
