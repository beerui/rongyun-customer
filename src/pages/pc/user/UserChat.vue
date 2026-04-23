<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConversationItem from '@/components/ConversationItem.vue'
import EmptyState from '@/components/EmptyState.vue'
import MessageInput from '@/components/MessageInput.vue'
import MessageList from '@/components/MessageList.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import OrderListDrawer from '@/components/drawers/OrderListDrawer.vue'
import ProductListDrawer from '@/components/drawers/ProductListDrawer.vue'
import { useAuthStore } from '@/stores/auth'
import { useConversationsStore } from '@/stores/conversations'
import { useImStore } from '@/stores/im'
import { useToastStore } from '@/stores/toast'
import { isEmbedded, sendToParent } from '@/utils/embed-bridge'
import { userChatLogger } from '@/utils/logger'
import { initSingleTab } from '@/utils/single-tab'
import { formatMessageTime } from '@/utils/time'
import type { OrderPayload, ProductPayload } from '@/im'
import PlatformIntro from './PlatformIntro.vue'

const auth = useAuthStore()
const im = useImStore()
const conversations = useConversationsStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()

const drawerOrder = ref(false)
const drawerProduct = ref(false)
const selfBlocked = ref(false)
const timeUpdateTrigger = ref(0)

const embedded = computed(() => isEmbedded())

const conversationItems = computed(() => {
  // 触发时间更新
  timeUpdateTrigger.value
  return conversations.list.map((c) => ({
    item: c,
    timeLabel: formatMessageTime(c.lastTime),
  }))
})

let cleanupSingleTab: (() => void) | null = null
let timeUpdateInterval: number | null = null

async function handleSelectConversation(targetId: string) {
  if (im.currentTargetId === targetId) return
  await im.openConversation(targetId)
  router.replace(`/buyer/${targetId}`)
  userChatLogger.info('用户切换对话', targetId)
}

watch(
  () => route.params.targetId as string | undefined,
  async (next, prev) => {
    if (!next || next === prev) return
    if (im.currentTargetId === next) return
    if (!im.connected) return
    await im.openConversation(next)
  },
)

onMounted(async () => {
  cleanupSingleTab = initSingleTab(() => {
    selfBlocked.value = true
    userChatLogger.warn('检测到重复标签页，本页已自我屏蔽')
    // 已经 load/watch 的资源由 onUnmounted 统一清理
    conversations.unwatch()
  })

  const targetId = route.params.targetId as string | undefined
  const q = route.query as Record<string, string | undefined>

  if (auth.role === 'guest' || !auth.rcToken) {
    try {
      if (q.daji_userId && q.daji_token) {
        auth.bootstrapFromUrlParams({
          userId: q.daji_userId,
          rcToken: q.daji_token,
          peerId: targetId,
        })
      } else {
        await auth.bootstrapUserWithTarget(targetId)
      }
    } catch (e) {
      userChatLogger.error('bootstrapUser 失败', e)
      return
    }
  }

  if (auth.rcToken && !im.connected) {
    try {
      await im.connect(auth.rcToken)
    } catch (e) {
      userChatLogger.error('IM 连接失败', e)
      return
    }
  }

  if (selfBlocked.value) return

  await conversations.load()
  if (selfBlocked.value) return
  conversations.watch()

  const initialTarget = targetId || auth.peerId || ''
  const targetToOpen = initialTarget || im.currentTargetId || conversations.list[0]?.targetId || ''

  if (targetToOpen && im.currentTargetId !== targetToOpen) {
    await im.openConversation(targetToOpen)
    if (initialTarget !== targetToOpen) {
      router.replace(`/buyer/${targetToOpen}`)
    }
  }

  // 每分钟更新一次时间显示
  timeUpdateInterval = window.setInterval(() => {
    timeUpdateTrigger.value++
  }, 60000)
})

onUnmounted(() => {
  cleanupSingleTab?.()
  conversations.unwatch()
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
    timeUpdateInterval = null
  }
})

function handleSendText(t: string) {
  im.sendTextMessage(t)
}
function handleSendImage(f: File) {
  im.sendImageFile(f)
}
function handleSendVideo(f: File) {
  im.sendVideoFile(f)
}
function handleSendFile(f: File) {
  im.sendFileMessage(f)
}

function handleMinimize() {
  sendToParent('daji:close')
}

function handleEnd() {
  if (!window.confirm('确认结束本次会话？')) return
  im.endConversation('user')
}

function onOpenDrawer(kind: 'order' | 'product' | 'coupon' | 'quick' | 'complaint' | 'agent' | 'platform') {
  switch (kind) {
    case 'order':
      drawerOrder.value = true
      return
    case 'product':
      drawerProduct.value = true
      return
    case 'complaint':
    case 'agent':
    case 'platform':
      toast.info('功能开发中，敬请期待')
      return
    case 'coupon':
    case 'quick':
      return
  }
}

async function sendProduct(p: ProductPayload) {
  await im.sendCard('product', p)
  drawerProduct.value = false
}

async function sendOrder(o: OrderPayload) {
  await im.sendCard('order', o)
  drawerOrder.value = false
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-bg-app min-w-[1200px]">
    <header class="h-20 bg-brand-500 flex items-center px-5 shrink-0 text-white">
      <div class="text-[20px] font-semibold">{{ auth.name || '平台客服' }}</div>
      <div class="flex items-center gap-1.5 ml-8 text-[14px]">
        <SvgIcon name="customer" />
        <span>为您在线解答(工作时间：工作日 8:30-18:00)</span>
      </div>
      <div class="flex-1" />
      <div v-if="embedded" class="flex items-center gap-2">
        <button type="button" class="h-8 px-3 text-[13px] rounded border border-white/40 hover:bg-white/15" @click="handleEnd">
          结束对话
        </button>
        <button
          type="button"
          class="h-8 px-3 text-[13px] rounded border border-white/40 hover:bg-white/15"
          title="收起到宿主站点"
          @click="handleMinimize"
        >
          收起
        </button>
      </div>
    </header>

    <div class="flex-1 flex min-h-0">
      <!-- 左侧：对话列表 -->
      <aside class="w-[280px] shrink-0 bg-bg-app border-r border-line-light flex flex-col">
        <div class="h-[60px] flex items-center px-5 shrink-0">
          <div class="text-[16px] font-semibold text-ink-900">我的对话</div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-2.5">
          <!-- 加载骨架屏 -->
          <div v-if="conversations.loading && !conversations.list.length" class="px-2.5 space-y-2">
            <div v-for="i in 3" :key="i" class="flex items-center gap-2.5 h-[70px]">
              <div class="flex-1 space-y-2">
                <div class="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div class="h-2 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>
              <div class="w-8 h-2 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          <!-- 错误态 -->
          <EmptyState v-else-if="conversations.error" title="加载失败" desc="对话列表加载失败，请重试">
            <button class="mt-4 px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600" @click="conversations.load()">重试</button>
          </EmptyState>

          <!-- 空态 -->
          <EmptyState v-else-if="!conversations.list.length" title="暂无对话" desc="选择商品或服务开始咨询" />

          <!-- 列表 -->
          <ConversationItem
            v-for="row in conversationItems"
            :key="row.item.targetId"
            :item="row.item"
            :active="row.item.targetId === im.currentTargetId"
            :time-label="row.timeLabel"
            @click="handleSelectConversation(row.item.targetId)"
          />
        </div>
      </aside>

      <!-- 中间：聊天区 -->
      <section class="flex-1 min-w-0 flex flex-col bg-white">
        <div v-if="!im.currentTargetId" class="flex-1 flex items-center justify-center bg-bg-app">
          <EmptyState title="正在接入客服…" desc="请稍候" />
        </div>
        <template v-else>
          <div class="flex-1 min-h-0 flex flex-col">
            <MessageList :messages="im.messages" :my-user-id="auth.userId" @retry="(id: string) => im.retry(id)" />
          </div>

          <MessageInput
            variant="desktop"
            role="user"
            :disabled="!im.connected"
            @send-text="handleSendText"
            @send-image="handleSendImage"
            @send-video="handleSendVideo"
            @send-file="handleSendFile"
            @open-drawer="onOpenDrawer"
          />
        </template>
      </section>

      <!-- 右侧：平台介绍卡片区 -->
      <aside class="w-[360px] shrink-0 bg-white border-l border-line-light overflow-y-auto scrollbar-thin">
        <PlatformIntro />
      </aside>
    </div>

    <!-- 功能抽屉 -->
    <OrderListDrawer
      :open="drawerOrder"
      :user-id="auth.userId"
      @close="drawerOrder = false"
      @send-order="sendOrder"
      @send-product="sendProduct"
    />
    <ProductListDrawer :open="drawerProduct" @close="drawerProduct = false" @send="sendProduct" />

    <!-- 单标签页自我屏蔽遮罩 -->
    <div v-if="selfBlocked" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md text-center">
        <div class="text-lg font-semibold mb-2">客服窗口已在其他标签页打开</div>
        <div class="text-sm text-ink-600 mb-4">
          为避免会话冲突，每个浏览器只允许打开一个客服窗口。
          <br />
          请回到原标签页继续使用，并关闭当前标签页。
        </div>
        <div class="text-xs text-ink-400">提示：按 Ctrl+W (Mac: Cmd+W) 关闭当前标签页</div>
      </div>
    </div>
  </div>
</template>
