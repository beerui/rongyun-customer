# 访客端对话列表功能设计文档

## 概述

**目标：** 为访客端新增对话列表功能，支持查看历史对话、切换不同客服对话；并通过单标签页"自我屏蔽"机制避免同一浏览器开多个客服窗口造成会话冲突。

**背景：** 当前访客端（UserChat.vue）只支持单一对话场景，无法查看和切换与不同客服的历史对话。在实际业务中，访客通过不同入口进入客服系统（例如：从店铺A商品页点击客服按钮、从店铺B商品页点击客服按钮、从平台帮助中心进入），每次进入都会建立一个新的对话。访客需要能够查看所有历史对话并在它们之间快速切换。本功能将访客端升级为多对话管理模式，并在用户重复打开访客端时让**新打开的标签页**自我屏蔽，避免会话状态分裂。

**业务场景说明：**
- 访客从店铺A商品页点击客服 → 建立与店铺A客服的对话
- 访客从店铺B商品页点击客服 → 建立与店铺B客服的对话
- 访客从平台帮助中心进入 → 建立与平台客服的对话
- 访客端显示所有历史对话列表，支持快速切换
- 重复打开访客端 → 后开的那个标签页显示"已有客服窗口在使用"遮罩，引导用户回到原标签页

**数据来源：**
- 主要：融云 IM 的 `getConversationList()` API（访客连接融云后，自动获取该访客的所有历史对话）
- 预留：后端 API 扩展接口（未来可通过后端 API 获取更丰富的对话元数据）

**技术栈：**
- Vue 3 Composition API + TypeScript
- Pinia (复用 conversations store)
- `broadcast-channel` 库（pubkey/broadcast-channel）—— 用于跨标签页握手，库内置原生 BC / LocalStorage / IndexedDB 多传输层降级，并兼容 iframe 嵌入场景
- 轻量级日志系统

---

## 架构设计

### 整体结构

```
UserChat.vue (三栏布局)
├── 左侧：对话列表区 (280px 固定宽度)
│   ├── 标题栏："我的对话"
│   ├── 对话项列表 (复用 ConversationItem 组件)
│   └── 空状态提示 (无对话时)
├── 中间：聊天区 (flex-1 自适应)
│   ├── MessageList (现有)
│   └── MessageInput (现有)
└── 右侧：平台介绍 (360px 固定宽度，现有)
```

### 模块职责

**1. 对话列表管理 (复用 conversations store)**
- 加载访客的所有对话列表（通过融云 IM 的 `getConversationList()` API）
- 监听对话变化（新消息、新对话）
- 按最后消息时间排序
- 预留后端 API 扩展能力（未来可通过后端接口获取更丰富的对话元数据）

**2. 单标签页强制 (新增 single-tab.ts)**
- 使用 `broadcast-channel` 库作为传输层（支持 iframe 嵌入、跨 origin tab 场景；同时天然回退 LocalStorage/IndexedDB，覆盖 Safari 15.4 以下）
- 采用"自我屏蔽"模式而非"干掉别人"：新标签页主动询问"是否已存在客服窗口"，已存在则**新标签页**显示遮罩
- 不依赖 `window.close()`（HTML 规范禁止脚本关闭非脚本打开的标签页，主流浏览器实测必失败）
- 通过显式握手（询问 + 等待 200ms 应答）避免双向竞态：两个标签页几乎同时打开时，**已在线的旧标签页**会回应 PONG，**后发起者**自我屏蔽

**3. 日志系统 (新增 logger.ts)**
- 轻量级日志封装，支持开发/生产环境区分
- 开发环境输出 debug 日志，生产环境只输出 warn/error
- 在关键位置埋点（对话加载、切换、单标签页事件）

---

## 数据流设计

### 对话列表加载流程

```
访客从不同入口进入（URL 携带不同的 target 参数）
  例如：
  - 店铺A商品页 → /chat?target=shop_a_agent_123
  - 店铺B商品页 → /chat?target=shop_b_agent_456
  - 平台帮助中心 → /chat?target=platform_agent_789
  ↓
UserChat.onMounted
  ↓
1. 解析 URL 参数（route.query.target）
  ↓
2. auth.bootstrapUser() - 初始化访客身份（获取 rcToken）
  ↓
3. im.connect(auth.rcToken) - 连接融云 IM（必须等待连接成功）
  ↓
4. conversations.load() - 调用融云 getConversationList() 获取所有历史对话
  ↓
5. conversations.watch() - 监听对话变化（新消息、新对话）
  ↓
6. 渲染 ConversationItem 列表（按最后消息时间倒序）
  ↓
7. 决定打开哪个对话（优先级见下）
```

**关键点：**
- URL 参数命名为 **`target`**（不沿用 `peerId`，避免和 `auth.peerId` 这个**访客身份字段**混淆）
- `auth.bootstrapUser()` 返回访客的 rcToken，用于连接融云 IM
- `getConversationList()` 返回该访客的所有历史对话（包括与不同店铺客服的对话）
- 每次从不同入口进入时，URL 携带不同的 target，自动打开对应对话
- 如果直接访问 `/chat`（无 target 参数），显示对话列表供用户选择

**初始打开对话的优先级（明确不要再让 `auth.peerId` 隐式介入）：**

```
优先级（高 → 低）
1. URL 参数 route.query.target — 用户主动从外部入口带过来的目标
2. im.currentTargetId            — 已在内存中保留的当前会话（页面内导航回来时复用）
3. conversations.list[0].targetId — 列表里最近活跃的一个（兜底自动接入）
4. 都没有 → 显示空状态"请选择左侧的对话"
```

**为什么不再用 `auth.peerId` 作为打开依据：** `auth.peerId` 是 bootstrap 时由后端写入的"默认接待客服"，它只代表"如果用户没有任何对话该接入谁"。一旦用户已有多个历史对话，再用它做"打开哪个"的依据会出现"我从店铺 A 入口进来，结果打开了上次的店铺 B 客服"的诡异现象。它的语义应当**只在 conversations.list 为空时**作为创建新对话的对端 ID。

**URL 参数解析实现：**
```typescript
// UserChat.vue 中添加
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

/** 用户主动点击左侧对话项时触发；只在这里同步 URL */
async function handleSelectConversation(targetId: string) {
  await im.openConversation(targetId)
  // 用 replace 而非 push，避免在浏览器历史里堆积重复条目
  router.replace({ query: { ...route.query, target: targetId } })
  userChatLogger.info('用户切换对话', targetId)
}

/** 监听 URL 中的 target 变化（响应浏览器后退/前进） */
watch(
  () => route.query.target as string | undefined,
  async (next, prev) => {
    if (!next || next === prev) return
    if (im.currentTargetId === next) return // URL 与内存一致，避免重入
    if (!im.connected) return                // 未连接时由 onMounted 流程负责
    await im.openConversation(next)
  },
)

onMounted(async () => {
  // 1. 解析 URL
  const initialTarget = route.query.target as string | undefined

  // 2. 初始化访客身份 + 连接 IM（保留现有容错）
  if (auth.role === 'guest' || !auth.rcToken) {
    try { await auth.bootstrapUser() }
    catch (e) { userChatLogger.error('bootstrapUser 失败', e); return }
  }
  if (auth.rcToken && !im.connected) {
    try { await im.connect(auth.rcToken) }
    catch (e) { userChatLogger.error('IM 连接失败', e); return }
  }

  // 3. 加载对话列表 + 注册监听
  await conversations.load()
  conversations.watch()

  // 4. 决定打开哪个对话（按优先级）
  const targetToOpen =
    initialTarget
    ?? im.currentTargetId
    ?? conversations.list[0]?.targetId

  if (targetToOpen && im.currentTargetId !== targetToOpen) {
    await im.openConversation(targetToOpen)
    if (initialTarget !== targetToOpen) {
      // URL 没带 target 但走了兜底，把兜底结果写回 URL，防止后退到"无 target"再触发不一致
      router.replace({ query: { ...route.query, target: targetToOpen } })
    }
  }
})
```

### 切换对话流程

```
用户主动点击对话项
  ↓
handleSelectConversation(targetId)
  ↓
im.openConversation(targetId)       — 切换到目标对话
  ↓
im.currentTargetId 更新
  ↓
router.replace({ query: { ...route.query, target } })  — 同步 URL（用 replace，不堆历史）
  ↓
高亮当前对话 + 加载该对话的消息列表
```

**URL 同步策略（明确边界，避免反向死循环）：**

| 场景 | 是否更新 URL | 原因 |
|---|---|---|
| 用户**主动点击**左侧对话项 | ✅ 是（`router.replace`） | 这是用户意图的体现，要让刷新可恢复 |
| 浏览器**后退/前进**导致 `route.query.target` 变化 | ❌ 不更新（由 watch 反向打开会话） | URL 是 source of truth，避免循环 |
| 收到**新消息**导致 conversations.list 重排 | ❌ 不更新 | 用户没有改变"在看哪个会话"，仅仅是排序变了 |
| `openConversation` 兜底自动打开列表第一个 | ✅ 是（仅 onMounted 阶段一次） | 让浏览器后退按钮能正确返回 |
| 系统主动结束会话或被转接 | ❌ 不更新 | 由业务事件驱动，不属于 URL 状态 |

**为什么用 `router.replace` 而非 `router.push`：** 用户在客服窗口里反复切换对话本质是浏览同一个页面，不是新的"页面访问"；用 push 会让"后退"键被切换记录塞满，体验糟糕。replace 只更新 URL，不堆历史，浏览器后退键直接回到访客进入客服窗口前的来源页。

### 单标签页强制流程

```
新标签页 B 打开 UserChat.vue
  ↓
onMounted 调用 initSingleTab(onConflict)
  ↓
创建 BroadcastChannel('daji-visitor-tab')
  ↓
B 发送 { type: 'PING' }，启动 200ms 倒计时
  ↓
旧标签页 A 收到 PING → 立即回 { type: 'PONG' }
  ↓
分支：
  ├─ B 在 200ms 内收到 PONG
  │     → B 调用 onConflict()，UI 显示自我屏蔽遮罩
  │     → B 不再加载会话，禁用所有交互
  │     → A 继续正常使用，不受影响
  │
  └─ B 超时未收到 PONG（说明确实是首个标签页）
        → B 注册 PING 监听器，转为"老人"角色
        → B 正常加载会话与列表
```

**为什么不"干掉旧标签页"：**
1. `window.close()` 在用户手动打开的标签页上**几乎一定失败**（HTML 规范限制），原方案的"主路径"实测不存在
2. "新页打开 → 旧页关闭"违背用户心智 —— 用户主动打开第二个，期望的是"被告知已经存在"，而不是莫名其妙关掉了第一个
3. 双向广播 + 自动关闭存在竞态：两边几乎同时打开会**互相关掉对方**，用户什么都看不到

**为什么用握手而不是单向广播：**
- BroadcastChannel **不会**把消息发给自己。仅靠"打开就 broadcast"无法判断"我是不是首个"，必须等待应答
- 200ms 阈值兼顾响应性与可靠性：原生 BC 延迟通常 <10ms，留余量给慢设备

---

## 组件设计

### 1. single-tab.ts (新增)

**职责：** 通过握手协议判定当前标签页是"首个"还是"重复"，对重复标签页触发自我屏蔽

**API：**
```typescript
/**
 * 初始化单标签页强制
 * @param onConflict 当探测到已有标签页存在时调用（用于在 UI 上显示屏蔽遮罩）
 * @returns 清理函数
 */
export function initSingleTab(onConflict: () => void): () => void
```

**实现要点：**
- 通过 `broadcast-channel` 库创建频道 `'daji-visitor-tab'`（库内自动选择最佳传输层：原生 BC → LocalStorage → IndexedDB）
- 启动时先 PING，等待 200ms：
  - 收到 PONG → 自己是重复标签页，调用 `onConflict`，**不再注册** PING 监听器
  - 未收到 → 自己是首个标签页，注册 PING 监听器，后续有新标签页 ping 自己时回 PONG
- 不调用 `window.close()`、不依赖 LocalStorage 自己手写降级（库已经替我们做了）

**完整实现代码：**
```typescript
// src/utils/single-tab.ts
import { BroadcastChannel } from 'broadcast-channel'
import { singleTabLogger } from './logger'

const CHANNEL_NAME = 'daji-visitor-tab'
const HANDSHAKE_TIMEOUT_MS = 200

type TabMessage = { type: 'PING' } | { type: 'PONG' }

export function initSingleTab(onConflict: () => void): () => void {
  const channel = new BroadcastChannel<TabMessage>(CHANNEL_NAME)
  let conflicted = false
  let timer: number | undefined

  // 阶段 1：探测期，只关心 PONG
  const probeListener = (msg: TabMessage) => {
    if (msg?.type === 'PONG' && !conflicted) {
      conflicted = true
      window.clearTimeout(timer)
      channel.removeEventListener('message', probeListener)
      singleTabLogger.warn('检测到已有客服标签页，本页将自我屏蔽')
      onConflict()
      // 注意：不调用 window.close()，不注册 PING 监听器
    }
  }
  channel.addEventListener('message', probeListener)

  singleTabLogger.debug('发送 PING 探测其他标签页')
  channel.postMessage({ type: 'PING' })

  // 阶段 2：超时未收到 PONG → 自己是首个，转为"老人"
  timer = window.setTimeout(() => {
    if (conflicted) return
    channel.removeEventListener('message', probeListener)
    singleTabLogger.info('未发现其他标签页，本页转为主标签页')

    channel.addEventListener('message', (msg: TabMessage) => {
      if (msg?.type === 'PING') {
        singleTabLogger.debug('收到 PING，回复 PONG')
        channel.postMessage({ type: 'PONG' })
      }
    })
  }, HANDSHAKE_TIMEOUT_MS)

  return () => {
    window.clearTimeout(timer)
    channel.close()
    singleTabLogger.debug('清理单标签页资源')
  }
}
```

**为什么使用 broadcast-channel 库（而不是原生 `BroadcastChannel`）：**
- **iframe / 跨源场景兼容**：原生 BC 受同源策略约束，跨源 iframe 之间收不到广播；本项目 SDK 已支持把访客端嵌入第三方网站的 iframe（PR #10–#13），这层兼容性是必需的
- **多传输层自动降级**：原生 BC、LocalStorage、IndexedDB 自动选择，覆盖 Safari 15.4 以下及 iOS Private Mode 等极端环境
- **作者口碑**：库作者 pubkey 也是 RxDB 作者，库本身是 RxDB 多窗口同步沉淀出来的实战代码，处理了原生 BC 的多个 corner case（消息顺序、关闭时序、Private Mode 等）
- **体积可控**：约 5KB gzipped，相对带来的兼容性收益值得

**握手时序示例：**

| 时序 | 标签 A（先打开） | 标签 B（后打开） |
|---|---|---|
| t=0 | PING（无回应） | — |
| t=200ms | 转为主标签页，开始监听 PING | — |
| t=10s | — | PING |
| t=10s+ε | 收到 PING → 回 PONG | — |
| t=10s+2ε | — | 收到 PONG → 触发 onConflict（显示遮罩） |
| t=10.2s | 继续正常使用 | 屏蔽态，不加载任何会话 |

**双向竞态场景：** 若 A、B 在同一毫秒打开，两边各自 PING；由于互相注册 listener 的时机仍有先后微差，**先注册的那个**会收到对方的 PING（但此时它还在探测期、不会回 PONG），双方最终都超时，**两边都成为主标签页**。这是已知容忍的极小概率边界，下次任何一方有新动作（页面刷新等）会重新对齐。如果业务对此 0 容忍，可以追加"轮询心跳"机制，本设计不引入。

---

### 2. logger.ts (新增)

**职责：** 提供轻量级日志管理工具

**完整实现代码：**
```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV

export class Logger {
  constructor(private readonly name: string) {}

  debug(...values: unknown[]): void {
    if (isDev) {
      console.debug(`[${this.name}]`, ...values)
    }
  }

  info(...values: unknown[]): void {
    console.info(`[${this.name}]`, ...values)
  }

  warn(...values: unknown[]): void {
    console.warn(`[${this.name}]`, ...values)
  }

  error(...values: unknown[]): void {
    console.error(`[${this.name}]`, ...values)
  }
}

// 导出各模块 logger
export const singleTabLogger = new Logger('SingleTab')
export const conversationsLogger = new Logger('Conversations')
export const userChatLogger = new Logger('UserChat')
```

---

### 3. UserChat.vue (修改)

**布局改造：**

**原布局（两栏）：**
```vue
<div class="flex">
  <section class="flex-1">聊天区</section>
  <aside class="w-[360px]">平台介绍</aside>
</div>
```

**新布局（三栏）：**
```vue
<div class="flex">
  <aside class="w-[280px]">对话列表</aside>
  <section class="flex-1">聊天区</section>
  <aside class="w-[360px]">平台介绍</aside>
</div>
```

**新增功能：**

> 完整的 `onMounted` 嵌入示例和 URL 同步代码已在「数据流设计 → 对话列表加载流程」段给出，下面只列出嵌入到现有代码的**职责清单**，避免与上文重复并防止两处示例代码不同步漂移。

1. **对话列表集成：**
   - 引入 `useConversationsStore` 和 `useRouter` / `useRoute`
   - 在现有 `onMounted` 内（`auth.bootstrapUser` + `im.connect` 之后、`ensureOpen` 替换为新优先级逻辑）调用 `conversations.load()` 和 `conversations.watch()`
   - 使用 `v-for` 渲染 `ConversationItem` 组件
   - 点击对话项 → `handleSelectConversation(targetId)`（实现见上文，含 URL `replace` 同步）
   - 高亮当前激活对话（`im.currentTargetId === conversation.targetId`）
   - **保留**现有的 `try/catch` 容错（`bootstrapUser` 失败 / `IM connect` 失败时静默退出，不再继续后续流程）

2. **URL 同步逻辑：**
   - 切换对话时：`router.replace({ query: { ...route.query, target } })`（**replace** 不堆历史；**target** 不复用 `peerId` 避免与 `auth.peerId` 混淆）
   - 监听 `route.query.target` 变化以响应浏览器后退/前进（见上文 watch 实现）
   - 排序变化、新消息、被动转接等都**不**触发 URL 更新（详见上文同步策略表）

3. **单标签页逻辑：**
   - `const cleanupSingleTab = initSingleTab(() => { showSelfBlockOverlay.value = true })`
   - `onUnmounted(() => cleanupSingleTab())`
   - 当 `showSelfBlockOverlay = true` 时，UI 渲染屏蔽遮罩（见错误处理 §2），**同时跳过**会话列表加载和 IM 连接

4. **日志埋点：**
   - 对话列表加载：`userChatLogger.info('对话列表加载完成', conversations.list.length)`
   - 切换对话：`userChatLogger.info('用户切换对话', targetId)`
   - 自我屏蔽触发：`userChatLogger.warn('检测到重复标签页，本页已自我屏蔽')`

**对话列表 UI 规范：**
- 宽度：280px 固定
- 背景色：`bg-bg-app` (#F5F5F5)
- 标题栏：高度 60px，文字"我的对话"，字号 16px，加粗
- 对话项：复用 `ConversationItem` 组件
- 当前对话高亮：背景色 `bg-[#FEF5F5]`（粉红色，与 ConversationItem 现有样式一致）
- 空状态：显示 `EmptyState` 组件，提示"暂无对话"
- 加载状态：显示骨架屏（3个占位对话项，灰色背景动画）
- 错误状态：显示"加载失败，请刷新重试"

**加载状态骨架屏（模拟真实对话项结构）：**
```vue
<!-- UserChat.vue 对话列表区域 -->
<div v-if="conversations.loading" class="px-5 space-y-2">
  <div v-for="i in 3" :key="i" class="flex items-center gap-2.5 h-[70px]">
    <div class="w-[38px] h-[38px] bg-gray-200 rounded-full animate-pulse"></div>
    <div class="flex-1 space-y-2">
      <div class="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
      <div class="h-2 bg-gray-200 rounded w-2/3 animate-pulse"></div>
    </div>
    <div class="w-8 h-2 bg-gray-200 rounded animate-pulse"></div>
  </div>
</div>
```

**时间格式化工具：**
```typescript
// src/utils/time.ts (新增)
function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function formatMessageTime(timestamp?: number): string {
  if (!timestamp) return ''
  
  const now = Date.now()
  const diff = now - timestamp
  const date = new Date(timestamp)
  
  // 1分钟内：刚刚
  if (diff < 60 * 1000) return '刚刚'
  
  // 1小时内：X分钟前
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }
  
  // 今天：HH:MM
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  
  // 昨天：昨天 HH:MM
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }
  
  // 今年：MM-DD
  if (date.getFullYear() === today.getFullYear()) {
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }
  
  // 更早：YYYY-MM-DD
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
```

---

### 4. conversations store (复用 + 小幅扩展)

**现有功能：**
- `load()` - 加载对话列表
- `watch()` - 监听对话变化
- `unwatch()` - 停止监听
- `list` - 对话列表数组
- `loading` - 加载状态

**本次新增：**

1. **错误状态 `error` ref**（由现有 `try/finally` 改造为 `try/catch/finally`），让 UI 可以根据它渲染重试态而不是靠调用方捕获异常：

```typescript
// src/stores/conversations.ts
const error = ref<Error | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    list.value = await getConversationList()
    list.value.sort((a, b) => (b.lastTime ?? 0) - (a.lastTime ?? 0))
    conversationsLogger.info('对话列表加载完成', list.value.length)
  } catch (e) {
    error.value = e instanceof Error ? e : new Error(String(e))
    conversationsLogger.error('对话列表加载失败', e)
    // 不再 throw —— 让 UI 通过 error ref 响应，避免每个调用方都写 try/catch
  } finally {
    loading.value = false
  }
}

return { list, loading, error, load, watch, unwatch }
```

2. **日志埋点**（已落地）：
   - `load()` 成功：`conversationsLogger.info('对话列表加载完成', list.value.length)`
   - `load()` 失败：`conversationsLogger.error('对话列表加载失败', error)`
   - `watch()` 监听到变化：`conversationsLogger.debug('对话更新', items.length)`

**为什么不 throw 错误：** 该 store 被客服工作台和访客端共用，两处都需要"失败后展示重试"，让每个调用方自己 `try/catch` 会导致错误处理分散且不一致。集中到 `error` ref 后，UI 可声明式渲染。

---

### 5. ConversationItem 组件 (需微调)

**显示内容：**
- 客服名称（item.title）
- 最后消息预览（item.lastMessage，文本截断）
- 最后消息时间（timeLabel prop，由父组件传入格式化后的时间）
- 未读消息数（item.unread，红色角标）

**当前实现状态：**
- ✅ 客服名称显示正常
- ✅ 最后消息预览正常
- ✅ 时间显示（通过 timeLabel prop）
- ❌ 未读消息数角标未实现（需要添加）
- ⚠️ Avatar 组件被注释（访客端暂不需要头像，保持现状）

**需要添加的未读角标实现：**

当前 `ConversationItem.vue:40-42` 时间区是单个 `<div>`：
```vue
<div class="shrink-0 text-[11px] text-ink-600/70 self-start pt-0.5">
  {{ timeLabel || '' }}
</div>
```

改造成 flex 容器，让"时间"和"未读角标"垂直堆叠（角标在时间下方更符合 IM 习惯）：
```vue
<div class="shrink-0 flex flex-col items-end gap-1 self-start pt-0.5">
  <div class="text-[11px] text-ink-600/70">{{ timeLabel || '' }}</div>
  <div
    v-if="item.unread > 0"
    class="bg-red-500 text-white text-[10px] rounded-full px-1.5 min-w-[18px] h-[16px] leading-[16px] text-center"
  >
    {{ item.unread > 99 ? '99+' : item.unread }}
  </div>
</div>
```

> ⚠️ 实施前请用 `git blame` 或 `grep` 确认行号未飘移（本次落地审查时为 40-42）。`Conversation` 类型已有 `unread: number` 字段（`src/im/types.ts:58`），无需改类型。

**交互：**
- 点击整个对话项触发切换
- 当前对话高亮显示（active prop 控制背景色）

---

## 错误处理

### 1. 对话列表加载失败

**场景：** `conversations.load()` 调用失败（网络错误、接口异常）

**处理：**
- `conversations.store` 中捕获并写入 `error` ref，日志记录：`conversationsLogger.error('对话列表加载失败', error)`
- UI 通过 `v-if="conversations.error"` 展示 `EmptyState` + 重试按钮

**EmptyState 实现：**
```vue
<!-- UserChat.vue 对话列表区域 -->
<EmptyState
  v-if="conversations.error"
  title="加载失败"
  desc="对话列表加载失败，请重试"
>
  <button
    class="mt-4 px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
    @click="conversations.load()"
  >
    重试
  </button>
</EmptyState>
```

### 2. 检测到重复标签页（自我屏蔽遮罩）

**场景：** `initSingleTab` 收到 PONG，意味着已有客服窗口在另一标签页运行

**处理：**
- 在**新标签页（也就是被屏蔽的这一边）** 显示全屏遮罩，提示"已有客服窗口在使用，请回到另一个标签页"
- 遮罩不可关闭（不提供"我知道了"按钮，避免用户误以为可以继续使用）
- **不调用 `window.close()`** —— HTML 规范禁止脚本关闭非脚本打开的标签页，主流浏览器实测必失败，调用反而会在控制台抛 warning
- 不再加载会话列表、不再连接 IM；让用户主动关闭这个多余标签页
- 日志记录：`logger.warn('检测到重复标签页，本页已自我屏蔽')`

**遮罩层实现：**
```vue
<!-- UserChat.vue 中添加 -->
<div v-if="showSelfBlockOverlay" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-6 max-w-md text-center">
    <div class="text-lg font-semibold mb-2">客服窗口已在其他标签页打开</div>
    <div class="text-sm text-ink-600 mb-4">
      为避免会话冲突，每个浏览器只允许打开一个客服窗口。<br>
      请回到原标签页继续使用，并关闭当前标签页。
    </div>
    <div class="text-xs text-ink-400">
      提示：按 Ctrl+W (Mac: Cmd+W) 关闭当前标签页
    </div>
  </div>
</div>
```

**为什么遮罩没有"切换到原标签页"按钮：** 因为浏览器没有公开 API 让网页 `focus` 另一个标签页（跨标签 `window.focus()` 仅对自己 `window.open` 出来的子窗口有效）。让用户自己 Cmd+Tab / 关闭当前标签页是唯一可行路径。

### 3. 切换对话失败

**场景：** `im.openConversation(targetId)` 调用失败

**处理：**
- 保持当前对话不变
- 显示 toast 提示"切换对话失败，请重试"
- 日志记录：`logger.error('切换对话失败', targetId, error)`

---

## 测试策略

### 功能测试

1. **对话列表功能：**
   - ✅ 访客端打开后自动加载对话列表
   - ✅ 对话列表按最后消息时间倒序排列
   - ✅ 点击对话项成功切换到对应对话
   - ✅ 当前对话高亮显示（白色背景 + 左侧红色边框）
   - ✅ 新消息到达时对话列表自动更新排序
   - ✅ 未读消息数正确显示

2. **单标签页强制：**
   - ✅ 打开第一个访客端标签页，正常使用
   - ✅ 打开第二个访客端标签页，第一个标签页自动关闭
   - ✅ 关闭提示正确显示
   - ✅ 如果 window.close() 失败，显示全屏遮罩提示

3. **日志系统：**
   - ✅ 开发环境下 console 输出 debug 级别日志
   - ✅ 生产环境下 console 只输出 warn 及以上级别日志
   - ✅ 日志格式正确：`[模块名] 消息内容`

### 边界测试

1. **无对话场景：**
   - ✅ 首次访问访客端，对话列表为空，显示"暂无对话"

2. **网络异常：**
   - ✅ 对话列表加载失败，显示错误提示

3. **多标签页快速切换：**
   - ✅ 快速打开多个标签页，只保留最后一个

---

## 文件清单

### 新增文件

1. **src/utils/single-tab.ts**
   - 单标签页管理工具
   - 约 20 行代码

2. **src/utils/logger.ts**
   - 轻量级日志系统
   - 约 30 行代码

3. **src/utils/time.ts**
   - 时间格式化工具
   - 约 30 行代码

4. **docs/superpowers/specs/2026-04-22-visitor-conversation-list-design.md**
   - 本设计文档

### 修改文件

1. **src/pages/pc/user/UserChat.vue**
   - 布局改造：两栏 → 三栏
   - 集成对话列表（加载、渲染、切换）
   - 集成单标签页逻辑
   - 新增日志埋点
   - 支持 peerId 参数自动打开对应对话
   - 预计修改约 150 行

2. **src/components/ConversationItem.vue**
   - 添加未读消息数红色角标
   - 预计修改约 5 行

3. **src/stores/conversations.ts**
   - 新增日志埋点
   - 预计修改约 10 行

4. **package.json**
   - 新增依赖：`broadcast-channel`

### 复用文件

1. **src/components/ConversationItem.vue** (无需修改)
2. **src/stores/im.ts** (无需修改)
3. **src/stores/auth.ts** (无需修改)

---

## 实施计划

实施顺序按照依赖关系组织：

### Phase 1: 基础工具层
1. 安装 `broadcast-channel` 依赖
2. 实现 `logger.ts` 轻量级日志系统
3. 实现 `time.ts` 时间格式化工具
4. 实现 `single-tab.ts` 单标签页管理（使用 broadcast-channel 库）

### Phase 2: Store 层增强
5. 在 `conversations.ts` 中添加日志埋点

### Phase 3: UI 层改造
6. 改造 `UserChat.vue` 布局（三栏）
7. 集成对话列表功能
8. 添加 ConversationItem 未读角标
9. 集成单标签页逻辑
10. 添加日志埋点

### Phase 4: 测试验证
11. 功能测试（对话列表、切换、单标签页）
12. 边界测试（无对话、网络异常、多标签页）
13. 日志输出验证

---

## 技术亮点

1. **代码复用最大化：** 复用 conversations store 和 ConversationItem 组件，避免重复开发

2. **broadcast-channel 库优势：** 跨浏览器兼容（支持 IE11、Safari 旧版本），自动降级，处理浏览器差异

3. **轻量级日志系统：** 简化日志实现，仅 30 行代码即可满足需求

4. **渐进式增强：** 在现有访客端基础上增量添加功能，不破坏现有逻辑

5. **用户体验优化：** 单标签页"自我屏蔽"避免会话冲突，对话列表支持快速切换

6. **多店铺场景支持：** 访客可同时与店铺A客服、店铺B客服、平台客服对话并快速切换

7. **URL 参数驱动：** 通过 URL 参数 `target` 实现从不同入口自动打开对应对话；并响应浏览器后退/前进

---

## 遗留问题

1. **对话列表性能优化：** 当对话数量超过 100 时，考虑虚拟滚动优化

2. **对话删除功能：** 当前设计不包含删除对话功能，未来可扩展

3. **对话搜索功能：** 当前设计不包含搜索功能，未来可扩展

4. **后端 API 扩展：** 当前使用融云 IM 的 `getConversationList()`，未来可扩展后端 API 获取更丰富的对话元数据

5. **同毫秒打开的双向竞态：** 详见「single-tab.ts → 双向竞态场景」段，本设计选择容忍此极小概率边界，未引入心跳机制

---

## 总结

本设计方案通过复用现有组件和 store，以最小改动实现访客端对话列表功能，支持多店铺场景下的对话切换。核心技术点包括：

- 三栏布局改造（对话列表 + 聊天区 + 平台介绍）
- `broadcast-channel` 库 + 显式握手协议实现单标签页"自我屏蔽"（不依赖 `window.close()`）
- URL `target` 参数驱动对话打开和切换，支持浏览器前进/后退
- conversations store 扩展 `error` ref，UI 声明式响应加载失败
- 轻量级日志系统接入（按模块命名空间区分）
- 时间格式化工具

预计开发工作量：2-3 天（包含测试）。
