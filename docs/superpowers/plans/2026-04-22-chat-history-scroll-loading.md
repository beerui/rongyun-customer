# 聊天记录下拉加载历史消息实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现滚动到顶部自动从融云 SDK 加载历史消息，支持分页和加载状态提示

**Architecture:** 在 IM Store 中添加历史加载状态管理（loadingHistory、hasMoreHistory、oldestTimestamp）和 loadMoreHistory 方法；MessageList 组件监听滚动事件，触顶时调用加载方法并恢复滚动位置；移除现有的窗口化逻辑。

**Tech Stack:** Vue 3 Composition API, Pinia, TypeScript, 融云 IM SDK

---

## 文件结构

**修改的文件：**
- `src/stores/im.ts` - 添加历史加载状态和方法
- `src/components/MessageList.vue` - 添加滚动监听，移除窗口化逻辑

**无需创建新文件**

---

## Task 1: IM Store 添加历史加载状态

**Files:**
- Modify: `src/stores/im.ts:26-34`

- [ ] **Step 1: 在 IM store 中添加历史加载状态变量**

在 `useImStore` 函数内部，`const unsubs: Array<() => void> = []` 这行之后添加：

```typescript
const loadingHistory = ref(false)
const hasMoreHistory = ref(true)
const oldestTimestamp = ref(0)
```

- [ ] **Step 2: 在 return 语句中导出新状态**

在 `return` 对象的末尾添加（在 `sendImageMessage` 之后）：

```typescript
loadingHistory,
hasMoreHistory,
```

- [ ] **Step 3: 验证代码编译通过**

Run: `npm run type-check` 或在 IDE 中检查无类型错误

Expected: 无编译错误

- [ ] **Step 4: Commit**

```bash
git add src/stores/im.ts
git commit -m "feat: 添加历史消息加载状态到 IM store

- 添加 loadingHistory 标记加载中状态
- 添加 hasMoreHistory 标记是否还有更多历史
- 添加 oldestTimestamp 记录最早消息时间戳

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

## Task 2: IM Store 实现 loadMoreHistory 方法

**Files:**
- Modify: `src/stores/im.ts:123` (在 `openConversation` 函数之前插入)

- [ ] **Step 1: 实现 loadMoreHistory 方法**

在 `openConversation` 函数定义之前添加：

```typescript
async function loadMoreHistory(): Promise<boolean> {
  if (loadingHistory.value || !hasMoreHistory.value || !currentTargetId.value) {
    return false
  }

  loadingHistory.value = true
  try {
    const history = await getHistory(currentTargetId.value, {
      timestamp: oldestTimestamp.value,
      count: 20,
    })

    if (history.length === 0) {
      hasMoreHistory.value = false
      return false
    }

    const sorted = history.sort((a, b) => a.sentTime - b.sentTime)
    messages.value.unshift(...sorted)

    oldestTimestamp.value = sorted[0].sentTime

    return true
  } catch (e) {
    console.warn('load more history failed', e)
    return false
  } finally {
    loadingHistory.value = false
  }
}
```

- [ ] **Step 2: 在 return 语句中导出 loadMoreHistory**

在 return 对象中添加（在 `openConversation` 之后）：

```typescript
loadMoreHistory,
```

- [ ] **Step 3: 验证代码编译通过**

Run: `npm run type-check`

Expected: 无编译错误

- [ ] **Step 4: Commit**

```bash
git add src/stores/im.ts
git commit -m "feat: 实现历史消息分页加载方法

- 添加 loadMoreHistory 方法支持分页加载
- 使用 oldestTimestamp 实现向前分页
- 每次加载 20 条历史消息
- 返回 0 条时标记 hasMoreHistory 为 false

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

## Task 3: IM Store 修改 openConversation 初始化状态

**Files:**
- Modify: `src/stores/im.ts:110-123`

- [ ] **Step 1: 在 openConversation 中重置历史加载状态**

修改 `openConversation` 函数，在 `messages.value = []` 之后添加状态重置：

```typescript
async function openConversation(targetId: string) {
  currentTargetId.value = targetId
  messages.value = []
  loadingHistory.value = false
  hasMoreHistory.value = true
  oldestTimestamp.value = 0
  unreadTotal.value = 0
  if (isEmbedded()) sendToParent('daji:unread', { count: 0 })
  try {
    const history = await getHistory(targetId, { count: 20 })
    messages.value = history.sort((a, b) => a.sentTime - b.sentTime)
    if (history.length > 0) {
      oldestTimestamp.value = history[0].sentTime
    }
    await clearUnread(targetId).catch(() => {})
  } catch (e) {
    console.warn('load history unavailable', e)
  }
}
```

- [ ] **Step 2: 验证代码编译通过**

Run: `npm run type-check`

Expected: 无编译错误

- [ ] **Step 3: Commit**

```bash
git add src/stores/im.ts
git commit -m "feat: openConversation 初始化历史加载状态

- 切换会话时重置 loadingHistory、hasMoreHistory、oldestTimestamp
- 首次加载改为 20 条（原来是 5 条）
- 设置初始 oldestTimestamp 用于后续分页

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

## Task 4: MessageList 移除窗口化逻辑

**Files:**
- Modify: `src/components/MessageList.vue:8-47`

- [ ] **Step 1: 移除窗口化相关的状态和方法**

删除以下代码（第 19-47 行）：

```typescript
// 删除这些代码：
const WINDOW_SIZE = 150
const WINDOW_STEP = 100
const visibleCount = ref(WINDOW_SIZE)

const windowed = computed(() => {
  const total = props.messages.length
  if (visibleCount.value >= total) return props.messages
  return props.messages.slice(total - visibleCount.value)
})

const hasMore = computed(() => visibleCount.value < props.messages.length)

async function loadEarlier() {
  if (!scroller.value) {
    visibleCount.value += WINDOW_STEP
    return
  }
  const prevHeight = scroller.value.scrollHeight
  const prevTop = scroller.value.scrollTop
  visibleCount.value += WINDOW_STEP
  await nextTick()
  const diff = scroller.value.scrollHeight - prevHeight
  scroller.value.scrollTop = prevTop + diff
}
```

- [ ] **Step 2: 修改 items computed 使用 props.messages**

将 `items` computed 中的 `windowed.value` 改为 `props.messages`：

```typescript
const items = computed(() => {
  const out: Array<{ kind: 'time'; ts: number; key: string } | { kind: 'msg'; m: Message; key: string }> = []
  let lastTs = 0
  for (const m of props.messages) {
    if (!lastTs || m.sentTime - lastTs > FIVE_MIN) {
      out.push({ kind: 'time', ts: m.sentTime, key: `t_${m.sentTime}` })
    }
    out.push({ kind: 'msg', m, key: m.id })
    lastTs = m.sentTime
  }
  return out
})
```

- [ ] **Step 3: 移除模板中的"加载更早"按钮**

删除模板中的这段代码（第 79-83 行）：

```vue
<!-- 删除这段 -->
<div v-if="hasMore" class="text-center mb-3">
  <button class="text-[11px] text-ink-500 hover:text-brand-500 px-3 py-1 rounded bg-bg-soft" @click="loadEarlier">
    加载更早的消息（剩余 {{ messages.length - visibleCount }} 条）
  </button>
</div>
```

- [ ] **Step 4: 验证代码编译通过**

Run: `npm run type-check`

Expected: 无编译错误

- [ ] **Step 5: Commit**

```bash
git add src/components/MessageList.vue
git commit -m "refactor: 移除 MessageList 窗口化逻辑

- 删除 visibleCount、windowed、loadEarlier 等窗口化代码
- 直接渲染 props.messages 全部消息
- 移除"加载更早的消息"按钮

为实现服务端分页加载做准备

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

## Task 5: MessageList 添加滚动监听和加载逻辑

**Files:**
- Modify: `src/components/MessageList.vue:1-17`

- [ ] **Step 1: 在 script setup 中引入 IM store 和添加状态**

在 `<script setup>` 顶部的 import 区域添加：

```typescript
import { useImStore } from '@/stores/im'
```

在 `const emit = ...` 之后添加：

```typescript
const im = useImStore()

const loading = computed(() => im.loadingHistory)
const hasMore = computed(() => im.hasMoreHistory)
```

- [ ] **Step 2: 添加滚动监听函数**

在 `scrollToBottom` 函数之后添加：

```typescript
function handleScroll() {
  if (!scroller.value || loading.value || !hasMore.value) return

  if (scroller.value.scrollTop < 50) {
    loadMore()
  }
}

async function loadMore() {
  if (!scroller.value) return

  const prevHeight = scroller.value.scrollHeight
  const prevTop = scroller.value.scrollTop

  const success = await im.loadMoreHistory()

  if (success) {
    await nextTick()
    const diff = scroller.value.scrollHeight - prevHeight
    scroller.value.scrollTop = prevTop + diff
  }
}
```

- [ ] **Step 3: 添加生命周期钩子绑定滚动事件**

在 `<script setup>` 中添加 `onMounted` 和 `onUnmounted` 的 import（如果还没有）：

```typescript
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
```

在文件末尾（`items` computed 之后）添加：

```typescript
onMounted(() => {
  scroller.value?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  scroller.value?.removeEventListener('scroll', handleScroll)
})
```

- [ ] **Step 4: 验证代码编译通过**

Run: `npm run type-check`

Expected: 无编译错误

- [ ] **Step 5: Commit**

```bash
git add src/components/MessageList.vue
git commit -m "feat: MessageList 添加滚动加载历史消息

- 监听 scroll 事件，检测 scrollTop < 50px 触发加载
- 调用 im.loadMoreHistory() 加载历史
- 加载后恢复滚动位置避免跳动
- 通过 loading 和 hasMore 状态防止重复加载

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

## Task 6: MessageList 添加加载状态 UI

**Files:**
- Modify: `src/components/MessageList.vue:76-78`

- [ ] **Step 1: 在模板顶部添加加载状态提示**

在 `<div ref="scroller" ...>` 内部，`<EmptyState>` 之后添加：

```vue
<div v-if="loading" class="text-center py-2">
  <span class="text-xs text-ink-500">加载中...</span>
</div>
<div v-else-if="!hasMore && messages.length > 0" class="text-center py-2">
  <span class="text-xs text-ink-400">没有更多消息了</span>
</div>
```

完整的模板结构应该是：

```vue
<template>
  <div ref="scroller" class="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 bg-white">
    <EmptyState v-if="!messages.length" title="还没有消息" desc="等待用户发起咨询…" />
    <div v-if="loading" class="text-center py-2">
      <span class="text-xs text-ink-500">加载中...</span>
    </div>
    <div v-else-if="!hasMore && messages.length > 0" class="text-center py-2">
      <span class="text-xs text-ink-400">没有更多消息了</span>
    </div>
    <template v-for="it in items" :key="it.key">
      <TimeDivider v-if="it.kind === 'time'" :ts="it.ts" />
      <MessageBubble
        v-else
        :message="it.m"
        :is-mine="it.m.senderId === myUserId || it.m.senderId === 'me'"
        @retry="(id) => emit('retry', id)"
        @recall="(id) => emit('recall', id)"
      />
    </template>
  </div>
</template>
```

- [ ] **Step 2: 在浏览器中测试 UI 显示**

Run: `npm run dev`

手动测试：
1. 打开客服工作台
2. 选择一个会话
3. 滚动到顶部，观察"加载中..."提示
4. 加载完成后，如果没有更多消息，观察"没有更多消息了"提示

Expected: 加载状态正确显示

- [ ] **Step 3: Commit**

```bash
git add src/components/MessageList.vue
git commit -m "feat: 添加历史消息加载状态 UI

- 加载中显示"加载中..."提示
- 没有更多历史时显示"没有更多消息了"
- 提示位于消息列表顶部

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

---

## Task 7: 端到端测试

**Files:**
- Test: 手动测试客服工作台

- [ ] **Step 1: 启动开发服务器**

Run: `npm run dev`

Expected: 服务器启动成功

- [ ] **Step 2: 测试基本加载流程**

测试步骤：
1. 打开客服工作台 `/agent`
2. 登录并选择一个会话
3. 观察初始加载 20 条消息
4. 滚动到顶部（scrollTop < 50px）
5. 观察"加载中..."提示出现
6. 等待加载完成，观察新消息插入到顶部
7. 验证滚动位置没有跳动

Expected: 
- 初始加载 20 条消息
- 滚动到顶部自动触发加载
- 加载中显示提示
- 新消息正确插入
- 滚动位置保持稳定

- [ ] **Step 3: 测试边界情况**

测试场景：
1. **没有更多历史**：持续滚动加载直到显示"没有更多消息了"
2. **切换会话**：切换到另一个会话，验证状态重置
3. **加载中防抖**：快速滚动到顶部，验证不会重复触发加载
4. **空会话**：选择一个没有消息的会话，验证不会崩溃

Expected: 所有边界情况正常处理

- [ ] **Step 4: 检查控制台错误**

在浏览器开发者工具中检查：
- 无 JavaScript 错误
- 无 TypeScript 类型错误
- 融云 SDK 调用正常

Expected: 无错误

- [ ] **Step 5: 记录测试结果**

如果发现问题，记录并修复。如果一切正常，继续下一步。

---

## Task 8: 最终提交和文档更新

**Files:**
- Modify: `docs/superpowers/specs/2026-04-22-chat-history-scroll-loading-design.md`

- [ ] **Step 1: 更新规范文档添加实施完成标记**

在规范文档顶部的 frontmatter 中添加：

```yaml
status: implemented
implemented_date: 2026-04-22
```

- [ ] **Step 2: Commit 文档更新**

```bash
git add docs/superpowers/specs/2026-04-22-chat-history-scroll-loading-design.md
git commit -m "docs: 标记聊天记录下拉加载功能已实施

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)

Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>"
```

- [ ] **Step 3: 推送分支到远程**

```bash
git push origin feat/chat-history-scroll-loading
```

Expected: 分支成功推送

- [ ] **Step 4: 创建 Pull Request（可选）**

如果项目使用 PR 流程，创建 PR：
- 标题：`feat: 聊天记录下拉加载历史消息`
- 描述：参考规范文档和实现计划
- 关联相关 issue（如有）

---

## 验收标准

✅ 用户滚动到消息列表顶部时自动触发历史消息加载  
✅ 每次加载 20 条历史消息  
✅ 加载中显示"加载中..."提示  
✅ 加载后滚动位置保持稳定不跳动  
✅ 没有更多历史时显示"没有更多消息了"  
✅ 切换会话时状态正确重置  
✅ 加载失败时不影响现有消息显示  
✅ 无 TypeScript 类型错误  
✅ 无运行时错误

## 技术债务和后续优化

- 考虑添加加载失败重试按钮
- 预加载优化（接近顶部时提前加载）
- 加载动画优化（骨架屏）
- 性能优化（大量消息时的虚拟滚动）
- 当返回消息数 < 20 时可以考虑停止加载（减少不必要的 API 调用）
