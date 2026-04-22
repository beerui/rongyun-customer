# 访客端对话列表功能设计文档

## 概述

**目标：** 为访客端新增对话列表功能，支持查看历史对话、切换不同客服对话，并强制同一浏览器只存在一个访客端标签页。

**背景：** 当前访客端（UserChat.vue）只支持单一对话场景，无法查看和切换与不同客服的历史对话。本功能将访客端升级为多对话管理模式，同时通过单标签页强制机制避免多窗口混乱。

**技术栈：**
- Vue 3 Composition API + TypeScript
- Pinia (复用 conversations store)
- broadcast-channel (单标签页强制)
- 自研日志系统 (参考 dj-common/logger.ts)

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
- 使用 BroadcastChannel 实现跨标签页通信
- 新标签页打开时通知旧标签页关闭
- 旧标签页收到通知后显示提示并执行 window.close()

**3. 日志系统 (新增 logger.ts)**
- 提供分级日志输出 (debug/info/warn/error/silent)
- 开发环境默认 debug 级别，生产环境默认 warn 级别
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
- 使用 `broadcast-channel` 库创建频道 `'daji-visitor-tab'`
- 初始化时立即发送 `'visitor-tab-opened'` 消息
- 监听其他标签页的消息，收到后调用 `onForceClose` 回调
- 清理时关闭 BroadcastChannel

**日志埋点：**
- 初始化：`logger.info('初始化单标签页管理')`
- 发送消息：`logger.debug('通知其他标签页关闭')`
- 收到消息：`logger.warn('检测到新标签页，准备关闭当前页')`

---

### 2. logger.ts (新增)

**职责：** 提供统一的日志管理工具

**API：**
```typescript
export class Logger {
  constructor(name: string, level?: LogLevel)
  setLevel(level: LogLevel): void
  debug(...values: unknown[]): void
  info(...values: unknown[]): void
  warn(...values: unknown[]): void
  error(...values: unknown[]): void
}

// 导出各模块 logger
export const singleTabLogger: Logger
export const conversationsLogger: Logger
export const userChatLogger: Logger
```

**实现要点：**
- 参考 `dj-common/src/logger.ts` 实现
- 支持日志级别过滤（debug < info < warn < error < silent）
- 全局日志级别：开发环境 `debug`，生产环境 `warn`
- 日志格式：`[模块名] 消息内容`

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
- 当前对话高亮：背景色 `bg-white`，左侧 3px 红色边框
- 空状态：显示 `EmptyState` 组件，提示"暂无对话"

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

### 5. ConversationItem 组件 (复用)

**显示内容（完整信息）：**
- 客服头像（Avatar 组件）
- 客服名称
- 最后消息预览（文本截断，最多显示一行）
- 最后消息时间（格式化显示）
- 未读消息数（红色角标）

**交互：**
- 点击整个对话项触发切换
- 当前对话高亮显示

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
- 显示全屏遮罩层，提示"检测到新标签页打开，请手动关闭此标签页"
- 日志记录：`logger.warn('window.close() 执行失败，需要用户手动关闭')`

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
   - 约 40 行代码

2. **src/utils/logger.ts**
   - 日志系统工具类
   - 约 60 行代码

3. **docs/superpowers/specs/2026-04-22-visitor-conversation-list-design.md**
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

3. **package.json**
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
2. 实现 `logger.ts` 日志系统
3. 实现 `single-tab.ts` 单标签页管理

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

2. **跨标签页通信：** 使用 `broadcast-channel` 库实现可靠的单标签页强制机制，兼容性好

3. **统一日志管理：** 参考 dj-common 实现日志系统，支持分级输出和环境区分

4. **渐进式增强：** 在现有访客端基础上增量添加功能，不破坏现有逻辑

5. **用户体验优化：** 单标签页强制避免多窗口混乱，对话列表支持快速切换

---

## 遗留问题

1. **对话列表性能优化：** 当对话数量超过 100 时，考虑虚拟滚动优化

2. **单标签页提示优化：** 可以考虑使用更友好的 UI 提示替代 alert

3. **对话删除功能：** 当前设计不包含删除对话功能，未来可扩展

4. **对话搜索功能：** 当前设计不包含搜索功能，未来可扩展

---

## 总结

本设计方案通过复用现有组件和 store，以最小改动实现访客端对话列表功能。核心技术点包括：

- 三栏布局改造
- BroadcastChannel 单标签页强制
- 统一日志系统接入

预计开发工作量：2-3 天（包含测试）。
