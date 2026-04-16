<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useImStore } from '@/stores/im'
import { useConversationsStore } from '@/stores/conversations'
import { useComposerStore } from '@/stores/composer'
import {
  suspendConversation,
  transferConversation,
  endConversation,
  fetchAgentsForTransfer,
} from '@/apis/customer'
import ConversationItem from '@/components/ConversationItem.vue'
import MessageList from '@/components/MessageList.vue'
import MessageInput from '@/components/MessageInput.vue'
import UserInfoPanel from './UserInfoPanel.vue'
import Avatar from '@/components/Avatar.vue'
import EmptyState from '@/components/EmptyState.vue'
import OrderListDrawer from '@/components/drawers/OrderListDrawer.vue'
import ProductListDrawer from '@/components/drawers/ProductListDrawer.vue'
import CouponDrawer from '@/components/drawers/CouponDrawer.vue'
import QuickReplyDrawer from '@/components/drawers/QuickReplyDrawer.vue'
import type { ProductPayload, OrderPayload, CouponPayload } from '@/im'

const auth = useAuthStore()
const im = useImStore()
const conv = useConversationsStore()
const composer = useComposerStore()

const keyword = ref('')
const filterKey = ref<'all' | 'waiting' | 'active'>('all')

/**
 * demo 对照数据 — 每个会话附带 tag，用来决定工具栏中"订单列表/商品列表"按钮的可见性
 * 规则（按接入用户的咨询类型）：
 *   退款申请 / 物流异常 / 物流查询 / 账户异常 → 订单相关 → 显示"订单列表"
 *   商品咨询 / 优惠问题 → 商品相关 → 显示"商品列表"
 *   其它 → 两个都显示
 */
const demoConvs = [
  { targetId: 'u_wen',  title: '温温', avatarBg: '#E8FFEA', tag: '退款申请', lastMessage: '我要申请退货退款.......', timeLabel: '5分钟' },
  { targetId: 'u_zs',   title: '张三', avatarBg: '#FFF7E8', tag: '物流异常', lastMessage: '我一直没收到货啊......',    timeLabel: '12分钟' },
  { targetId: 'u_ls',   title: '李四', avatarBg: '#FFECE8', tag: '物流查询', lastMessage: '我的快递到哪里了？',        timeLabel: '30分钟' },
  { targetId: 'u_wq1',  title: '王强', avatarBg: '#E6F4FF', tag: '商品咨询', lastMessage: '这个有没有红色的？',        timeLabel: '45分钟' },
  { targetId: 'u_wq2',  title: '赵敏', avatarBg: '#E6F4FF', tag: '优惠问题', lastMessage: '新人券怎么领？',            timeLabel: '1小时' },
]

const filtered = computed(() => {
  const base = conv.list.length
    ? conv.list.map((c, i) => ({
        ...c,
        tag: (demoConvs[i % demoConvs.length] as any).tag,
        avatarBg: (demoConvs[i % demoConvs.length] as any).avatarBg,
        timeLabel: '',
      }))
    : demoConvs.map((c) => ({ ...c, unread: 0, lastTime: 0 } as any))
  return base.filter((c: any) => !keyword.value || c.title.includes(keyword.value))
})

const activePeer = computed(() => {
  const id = im.currentTargetId || filtered.value[0]?.targetId
  const c: any = filtered.value.find((x: any) => x.targetId === id)
  return c ? { id: c.targetId, name: c.title, avatar: c.avatar, avatarBg: c.avatarBg, tag: c.tag } : undefined
})

const toolVisibility = computed(() => {
  const tag = activePeer.value?.tag || ''
  const orderTags = ['退款申请', '物流异常', '物流查询', '账户异常']
  const productTags = ['商品咨询', '优惠问题']
  const showOrder = orderTags.includes(tag) || !productTags.includes(tag)
  const showProduct = productTags.includes(tag) || !orderTags.includes(tag)
  return { showOrder, showProduct, showCoupon: true, showQuick: true }
})

const stats = { today: '23', satisfaction: '99.6%', avgDuration: '4m12s', solveRate: '91.6%' }

async function selectConv(targetId: string) {
  await im.openConversation(targetId)
}

// ========== 会话操作：挂起 / 转接 / 结束 ==========

const showTransfer = ref(false)
const transferAgents = ref<Array<{ id: string; name: string; avatar?: string; online?: boolean }>>([])
const transferKeyword = ref('')
const busy = ref<'' | 'suspend' | 'transfer' | 'end'>('')

async function onSuspend() {
  if (!activePeer.value || busy.value) return
  if (!confirm(`确定挂起与 ${activePeer.value.name} 的会话？`)) return
  busy.value = 'suspend'
  try {
    await suspendConversation(activePeer.value.id).catch(() => {})
    alert('已挂起（模拟）')
  } finally { busy.value = '' }
}

async function openTransfer() {
  if (!activePeer.value || busy.value) return
  showTransfer.value = true
  transferKeyword.value = ''
  try {
    transferAgents.value = await fetchAgentsForTransfer()
  } catch {
    transferAgents.value = [
      { id: 'agent2', name: '小伊', online: true },
      { id: 'agent3', name: '客服3', online: false },
      { id: 'agent4', name: '客服4', online: true },
    ]
  }
}

async function onTransferTo(agentId: string) {
  if (!activePeer.value) return
  busy.value = 'transfer'
  try {
    await transferConversation(activePeer.value.id, agentId).catch(() => {})
    showTransfer.value = false
    alert('已转接（模拟）')
  } finally { busy.value = '' }
}

async function onEnd() {
  if (!activePeer.value || busy.value) return
  if (!confirm(`确定结束与 ${activePeer.value.name} 的会话？`)) return
  busy.value = 'end'
  try {
    await endConversation(activePeer.value.id).catch(() => {})
    alert('会话已结束（模拟）')
  } finally { busy.value = '' }
}

const filteredAgents = computed(() =>
  transferAgents.value.filter((a) => !transferKeyword.value || a.name.includes(transferKeyword.value)),
)

// ========== 工具栏抽屉 ==========

const drawerOrder = ref(false)
const drawerProduct = ref(false)
const drawerCoupon = ref(false)
const drawerQuick = ref(false)

function onOpenDrawer(kind: 'order' | 'product' | 'coupon' | 'quick') {
  if (kind === 'order')   drawerOrder.value = true
  if (kind === 'product') drawerProduct.value = true
  if (kind === 'coupon')  drawerCoupon.value = true
  if (kind === 'quick')   drawerQuick.value = true
}

async function sendProduct(p: ProductPayload) {
  await im.sendCard('product', p)
  drawerProduct.value = false
}

async function sendOrder(o: OrderPayload) {
  await im.sendCard('order', o)
  drawerOrder.value = false
}

async function sendCoupon(c: CouponPayload) {
  await im.sendCard('coupon', c)
  drawerCoupon.value = false
}

function pickQuickReply(t: string) {
  composer.insert(t)
  drawerQuick.value = false
}

async function sendQuickReply(t: string) {
  await im.sendTextMessage(t)
  drawerQuick.value = false
}

// ========== 发送 ==========

onMounted(async () => {
  if (!im.connected && auth.rcToken) {
    im.connect(auth.rcToken).catch((e) => console.warn('RC connect failed:', e))
  }
  try { await conv.load() } catch {}
  conv.watch()
})

onUnmounted(() => { conv.unwatch() })

function handleSendText(t: string) { im.sendTextMessage(t) }
function handleSendImage(f: File) { im.sendImageFile(f) }
function handleSendVideo(f: File) { im.sendVideoFile(f) }
function handleSendFile(f: File)  { im.sendFileMessage(f) }

function logout() {
  im.disconnect()
  auth.logout()
  location.href = '/agent/login'
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-bg-app min-w-[1280px]">
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
              :class="filterKey === f.k ? 'bg-brand-500 text-white' : 'bg-bg-soft text-ink-700 hover:bg-line-light'"
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
            :active="c.targetId === (im.currentTargetId || filtered[0]?.targetId)"
            :time-label="(c as any).timeLabel"
            @click="selectConv(c.targetId)"
          />
        </div>
      </section>

      <section class="flex-1 min-w-0 flex flex-col bg-white">
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
            <button
              class="h-8 px-3 rounded border border-line-light text-xs text-ink-700 hover:border-brand-500 hover:text-brand-500 disabled:opacity-50"
              :disabled="!!busy"
              @click="openTransfer"
            >{{ busy === 'transfer' ? '转接中…' : '转接' }}</button>
            <button
              class="h-8 px-3 rounded border border-line-light text-xs text-ink-700 hover:border-brand-500 hover:text-brand-500 disabled:opacity-50"
              :disabled="!!busy"
              @click="onSuspend"
            >{{ busy === 'suspend' ? '挂起中…' : '挂起' }}</button>
            <button
              class="h-8 px-3 rounded bg-brand-500 hover:bg-brand-600 text-white text-xs disabled:opacity-50"
              :disabled="!!busy"
              @click="onEnd"
            >{{ busy === 'end' ? '结束中…' : '结束会话' }}</button>
          </div>
        </div>

        <div v-if="!activePeer" class="flex-1 flex items-center justify-center bg-bg-app">
          <EmptyState title="选择一个会话开始聊天" />
        </div>
        <template v-else>
          <div class="flex-1 min-h-0 flex flex-col">
            <div class="text-center py-3 text-[11px] text-ink-600 bg-white shrink-0">
              今天 12:32 会话开始
            </div>
            <MessageList
              :messages="im.messages"
              :my-user-id="auth.userId"
              @retry="(id: string) => im.retry(id)"
            />
          </div>

          <MessageInput
            variant="desktop"
            :disabled="!im.connected"
            :show-order="toolVisibility.showOrder"
            :show-product="toolVisibility.showProduct"
            :show-coupon="toolVisibility.showCoupon"
            :show-quick="toolVisibility.showQuick"
            @send-text="handleSendText"
            @send-image="handleSendImage"
            @send-video="handleSendVideo"
            @send-file="handleSendFile"
            @open-drawer="onOpenDrawer"
          />
        </template>
      </section>

      <aside class="w-[300px] shrink-0">
        <UserInfoPanel :peer="activePeer" @open-drawer="onOpenDrawer" />
      </aside>
    </div>

    <!-- 转接弹窗 -->
    <div v-if="showTransfer" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showTransfer = false">
      <div class="w-[420px] bg-white rounded-lg shadow-card">
        <div class="px-5 py-3 border-b border-line-light flex items-center justify-between">
          <div class="text-sm font-semibold text-ink-900">转接到其他客服</div>
          <button class="text-ink-600 hover:text-ink-900" @click="showTransfer = false">✕</button>
        </div>
        <div class="px-5 py-3">
          <input
            v-model="transferKeyword"
            placeholder="搜索客服名称"
            class="w-full h-8 rounded border border-line-light px-3 text-xs focus:outline-none focus:border-brand-500"
          />
        </div>
        <div class="max-h-[320px] overflow-y-auto scrollbar-thin">
          <div v-if="!filteredAgents.length" class="text-center py-8 text-xs text-ink-600">暂无可选客服</div>
          <button
            v-for="a in filteredAgents"
            :key="a.id"
            class="w-full flex items-center gap-3 px-5 py-3 hover:bg-bg-soft disabled:opacity-50"
            :disabled="!!busy"
            @click="onTransferTo(a.id)"
          >
            <Avatar :name="a.name" :src="a.avatar" :size="36" />
            <div class="flex-1 text-left">
              <div class="text-sm text-ink-900">{{ a.name }}</div>
              <div class="text-[11px] text-ink-600">{{ a.online ? '在线' : '离线' }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- 功能抽屉 -->
    <OrderListDrawer
      :open="drawerOrder"
      :user-id="activePeer?.id || ''"
      @close="drawerOrder = false"
      @send-order="sendOrder"
      @send-product="sendProduct"
    />
    <ProductListDrawer
      :open="drawerProduct"
      @close="drawerProduct = false"
      @send="sendProduct"
    />
    <CouponDrawer
      :open="drawerCoupon"
      @close="drawerCoupon = false"
      @send="sendCoupon"
    />
    <QuickReplyDrawer
      :open="drawerQuick"
      @close="drawerQuick = false"
      @pick="pickQuickReply"
      @send="sendQuickReply"
    />
  </div>
</template>
