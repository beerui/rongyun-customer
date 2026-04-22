<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Avatar from '@/components/Avatar.vue'
import EmptyState from '@/components/EmptyState.vue'
import MessageInput from '@/components/MessageInput.vue'
import MessageList from '@/components/MessageList.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import OrderListDrawer from '@/components/drawers/OrderListDrawer.vue'
import ProductListDrawer from '@/components/drawers/ProductListDrawer.vue'
import { useAuthStore } from '@/stores/auth'
import { useImStore } from '@/stores/im'
import { isEmbedded, sendToParent } from '@/utils/embed-bridge'
import type { OrderPayload, ProductPayload } from '@/im'
import PlatformIntro from './PlatformIntro.vue'

const auth = useAuthStore()
const im = useImStore()

// 抽屉状态
const drawerOrder = ref(false)
const drawerProduct = ref(false)

// 仅在 iframe 嵌入场景下（SDK Launcher Widget 模式）显示"收起 / 结束对话"两枚按钮
const embedded = computed(() => isEmbedded())

async function ensureOpen() {
  if (!auth.peerId || !im.connected) return
  if (im.currentTargetId !== auth.peerId) {
    await im.openConversation(auth.peerId)
  }
}

onMounted(async () => {
  if (auth.role === 'guest' || !auth.rcToken) {
    try {
      await auth.bootstrapUser()
    } catch (e) {
      console.warn('bootstrapUser failed', e)
      return // 获取失败就不要往下走了
    }
  }

  if (auth.rcToken && !im.connected) {
    try {
      // 加上 await 等待连接完全成功
      await im.connect(auth.rcToken)
    } catch (e) {
      console.warn('RC connect failed:', e)
      return // 连接失败就不再执行 ensureOpen
    }
  }

  await ensureOpen()
})

watch(() => [im.connected, auth.peerId], ensureOpen)

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

function onOpenDrawer(kind: 'order' | 'product' | 'coupon' | 'quick') {
  if (kind === 'order') drawerOrder.value = true
  if (kind === 'product') drawerProduct.value = true
  // 访客端不支持优惠券和快捷回复
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
  <div class="h-screen w-screen flex flex-col bg-bg-app min-w-[960px]">
    <!-- 顶部红色栏（与工作台一致） -->
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
      <!-- 中间：聊天区（无左侧会话列表） -->
      <section class="flex-1 min-w-0 flex flex-col bg-white">
        <!-- <div class="flex items-center gap-3 px-6 h-16 border-b border-line-light shrink-0">
          <Avatar name="客" :size="38" :bg="'#FEF5F5'" />
          <div class="min-w-0">
            <div class="text-base font-semibold text-ink-900">平台客服</div>
            <div class="text-[12px] text-ink-600 mt-0.5">您好，有什么可以帮您？</div>
          </div>
        </div> -->

        <div v-if="!im.currentTargetId" class="flex-1 flex items-center justify-center bg-bg-app">
          <EmptyState title="正在接入客服…" desc="请稍候" />
        </div>
        <template v-else>
          <div class="flex-1 min-h-0 flex flex-col">
            <!-- <div class="text-center py-3 text-[11px] text-ink-600 bg-white shrink-0">
              今天 会话开始
            </div> -->
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
  </div>
</template>
