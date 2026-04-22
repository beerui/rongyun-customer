# 访客端对话列表功能设计文档

## 概述

**目标：** 为访客端新增对话列表功能，支持查看历史对话、切换不同客服对话，并强制同一浏览器只存在一个访客端标签页。

**背景：** 当前访客端（UserChat.vue）只支持单一对话场景，无法查看和切换与不同客服的历史对话。在实际业务中，一个访客可能同时与多个店铺客服对话（店铺A客服、店铺B客服、平台客服等），需要能够在这些对话之间快速切换。本功能将访客端升级为多对话管理模式，同时通过单标签页强制机制避免多窗口混乱。

**技术栈：**
- Vue 3 Composition API + TypeScript
- Pinia (复用 conversations store)
- 原生 BroadcastChannel API (单标签页强制)
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
- 加载访客的所有对话列表
- 监听对话变化（新消息、新对话）
- 按最后消息时间排序

**2. 单标签页强制 (新增 single-tab.ts)**
- 使用原生 BroadcastChannel API 实现跨标签页通信（Chrome 54+, Firefox 38+, Safari 15.4+）
- 新标签页打开时通知旧标签页关闭
- 旧标签页收到通知后显示提示并执行 window.close()

**3. 日志系统 (新增 logger.ts)**
- 轻量级日志封装，支持开发/生产环境区分
- 开发环境输出 debug 日志，生产环境只输出 warn/error
- 在关键位置埋点（对话加载、切换、单标签页事件）

---

## 数据流设计

### 对话列表加载流程

```
UserChat.onMounted
  ↓
auth.bootstrapUser() - 确保访客身份初始化
  ↓
im.connect(auth.rcToken) - 连接融云 IM
  ↓
conversations.load() - 加载对话列表
  ↓
conversations.watch() - 监听对话变化
  ↓
渲染 ConversationItem 列表
```

### 切换对话流程

```
用户点击对话项
  ↓
im.openConversation(targetId) - 切换到目标对话
  ↓
im.currentTargetId 更新
  ↓
高亮当前对话 + 加载该对话的消息列表
```

### 单标签页强制流程

```
新标签页打开 UserChat.vue
  ↓
onMounted 调用 initSingleTab()
  ↓
创建 BroadcastChannel('daji-visitor-tab')
  ↓
发送消息 'visitor-tab-opened'
  ↓
旧标签页收到消息
  ↓
显示 alert 提示 + 执行 window.close()
```

---

## 组件设计

### 1. single-tab.ts (新增)

**职责：** 管理访客端单标签页强制逻辑

**API：**
```typescript
// 初始化单标签页管理
export function initSingleTab(onForceClose: () => void): void

// 清理资源
export function cleanupSingleTab(): void
```

**实现要点：**
- 使用原生 `new BroadcastChannel('daji-visitor-tab')` 创建频道
- 初始化时立即发送 `'visitor-tab-opened'` 消息
- 监听其他标签页的消息，收到后调用 `onForceClose` 回调
- 清理时关闭 BroadcastChannel

**完整实现代码：**
```typescript
// src/utils/single-tab.ts
let channel: BroadcastChannel | null = null

export function initSingleTab(onForceClose: () => void): void {
  channel = new BroadcastChannel('daji-visitor-tab')
  
  channel.onmessage = (event) => {
    if (event.data === 'visitor-tab-opened') {
      onForceClose()
      window.close()
    }
  }
  
  channel.postMessage('visitor-tab-opened')
}

export function cleanupSingleTab(): void {
  channel?.close()
  channel = null
}
```

**日志埋点：**
- 初始化：`logger.info('初始化单标签页管理')`
- 发送消息：`logger.debug('通知其他标签页关闭')`
- 收到消息：`logger.warn('检测到新标签页，准备关闭当前页')`

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

1. **对话列表集成：**
   - 引入 `useConversationsStore`
   - onMounted 时调用 `conversations.load()` 和 `conversations.watch()`
   - 使用 `v-for` 渲染 `ConversationItem` 组件
   - 点击对话项时调用 `im.openConversation(targetId)`
   - 高亮当前激活对话（`im.currentTargetId === conversation.targetId`）

2. **单标签页逻辑：**
   - onMounted 时调用 `initSingleTab(() => { alert('检测到新标签页打开，当前页面即将关闭'); })`
   - onUnmounted 时调用 `cleanupSingleTab()`

3. **日志埋点：**
   - 对话列表加载：`logger.info('对话列表加载完成', conversations.list.length)`
   - 切换对话：`logger.info('切换对话', targetId)`
   - 单标签页强制关闭：`logger.warn('被新标签页强制关闭')`

**对话列表 UI 规范：**
- 宽度：280px 固定
- 背景色：`bg-bg-app` (#F5F5F5)
- 标题栏：高度 60px，文字"我的对话"，字号 16px，加粗
- 对话项：复用 `ConversationItem` 组件
- 当前对话高亮：背景色 `bg-[#FEF5F5]`（粉红色，与 ConversationItem 现有样式一致）
- 空状态：显示 `EmptyState` 组件，提示"暂无对话"
- 加载状态：显示 loading 提示
- 错误状态：显示"加载失败，请刷新重试"

**时间格式化工具：**
```typescript
// src/utils/time.ts (新增)
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
    return date.toTimeString().slice(0, 5)
  }
  
  // 昨天：昨天 HH:MM
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toTimeString().slice(0, 5)}`
  }
  
  // 今年：MM-DD
  if (date.getFullYear() === today.getFullYear()) {
    return `${date.getMonth() + 1}-${date.getDate()}`
  }
  
  // 更早：YYYY-MM-DD
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}
```

---

### 4. conversations store (复用)

**现有功能：**
- `load()` - 加载对话列表
- `watch()` - 监听对话变化
- `unwatch()` - 停止监听
- `list` - 对话列表数组
- `loading` - 加载状态

**新增日志埋点：**
- `load()` 成功：`logger.info('对话列表加载完成', list.value.length)`
- `load()` 失败：`logger.error('对话列表加载失败', error)`
- `watch()` 监听到变化：`logger.debug('对话更新', items.length)`

---

### 5. ConversationItem 组件 (复用，无需修改)

**显示内容：**
- 客服名称（item.title）
- 最后消息预览（item.lastMessage，文本截断）
- 最后消息时间（timeLabel prop，由父组件传入格式化后的时间）
- 未读消息数（item.unread，Conversation 类型已包含此字段）

**当前实现状态：**
- ✅ 客服名称显示正常
- ✅ 最后消息预览正常
- ✅ 时间显示（通过 timeLabel prop）
- ⚠️ 未读消息数角标未实现（需要在 UserChat.vue 中添加，或后续优化）
- ⚠️ Avatar 组件被注释（访客端暂不需要头像，保持现状）

**交互：**
- 点击整个对话项触发切换
- 当前对话高亮显示（active prop 控制背景色）

**注意：** ConversationItem 组件当前实现已满足基本需求，未读消息数角标可作为后续优化项。

---

## 错误处理

### 1. 对话列表加载失败

**场景：** `conversations.load()` 调用失败（网络错误、接口异常）

**处理：**
- 显示 `EmptyState` 组件，提示"加载失败，请刷新重试"
- 日志记录：`logger.error('对话列表加载失败', error)`

### 2. window.close() 失败

**场景：** 旧标签页收到关闭通知，但 `window.close()` 执行失败（某些浏览器限制非脚本打开的窗口不能关闭）

**处理：**
- 显示全屏遮罩层组件，提示"检测到您在其他标签页打开了客服窗口，建议关闭此页面以避免消息混乱"
- 提供"我知道了"按钮，点击后隐藏遮罩但保持页面可用
- 日志记录：`logger.warn('window.close() 执行失败，显示提示遮罩')`

**遮罩层实现：**
```vue
<!-- UserChat.vue 中添加 -->
<div v-if="showForceCloseOverlay" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-6 max-w-md">
    <div class="text-lg font-semibold mb-2">检测到新标签页</div>
    <div class="text-sm text-ink-600 mb-4">
      检测到您在其他标签页打开了客服窗口，建议关闭此页面以避免消息混乱。
    </div>
    <button 
      class="w-full h-10 bg-brand-500 text-white rounded hover:bg-brand-600"
      @click="showForceCloseOverlay = false"
    >
      我知道了
    </button>
  </div>
</div>
```

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
   - 集成对话列表
   - 集成单标签页逻辑
   - 新增日志埋点
   - 预计修改约 100 行

2. **src/stores/conversations.ts**
   - 新增日志埋点
   - 预计修改约 10 行

### 复用文件

1. **src/components/ConversationItem.vue** (无需修改)
2. **src/stores/im.ts** (无需修改)
3. **src/stores/auth.ts** (无需修改)

---

## 实施计划

实施顺序按照依赖关系组织：

### Phase 1: 基础工具层
1. 实现 `logger.ts` 轻量级日志系统
2. 实现 `time.ts` 时间格式化工具
3. 实现 `single-tab.ts` 单标签页管理（使用原生 BroadcastChannel API）

### Phase 2: Store 层增强
4. 在 `conversations.ts` 中添加日志埋点

### Phase 3: UI 层改造
5. 改造 `UserChat.vue` 布局（三栏）
6. 集成对话列表功能
7. 集成单标签页逻辑
8. 添加日志埋点

### Phase 4: 测试验证
9. 功能测试（对话列表、切换、单标签页）
10. 边界测试（无对话、网络异常、多标签页）
11. 日志输出验证

---

## 技术亮点

1. **代码复用最大化：** 复用 conversations store 和 ConversationItem 组件，避免重复开发

2. **原生 API 优先：** 使用原生 BroadcastChannel API 实现单标签页强制，无需额外依赖

3. **轻量级日志系统：** 简化日志实现，仅 30 行代码即可满足需求

4. **渐进式增强：** 在现有访客端基础上增量添加功能，不破坏现有逻辑

5. **用户体验优化：** 单标签页强制避免多窗口混乱，对话列表支持快速切换

6. **多店铺场景支持：** 访客可同时与店铺A客服、店铺B客服、平台客服对话并快速切换

---

## 遗留问题

1. **未读消息数角标：** ConversationItem 组件未实现未读消息数红色角标显示，可作为后续优化项

2. **对话列表性能优化：** 当对话数量超过 100 时，考虑虚拟滚动优化

3. **对话删除功能：** 当前设计不包含删除对话功能，未来可扩展

4. **对话搜索功能：** 当前设计不包含搜索功能，未来可扩展

---

## 总结

本设计方案通过复用现有组件和 store，以最小改动实现访客端对话列表功能，支持多店铺场景下的对话切换。核心技术点包括：

- 三栏布局改造（对话列表 + 聊天区 + 平台介绍）
- 原生 BroadcastChannel API 实现单标签页强制
- 轻量级日志系统接入
- 时间格式化工具

预计开发工作量：2-3 天（包含测试）。
