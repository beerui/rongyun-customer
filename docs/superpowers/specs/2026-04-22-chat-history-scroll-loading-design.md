---
name: 聊天记录下拉加载历史消息
description: 实现滚动到顶部自动加载融云历史消息，支持分页和加载状态提示
type: feature
status: implemented
implemented_date: 2026-04-22
---

# 聊天记录下拉加载历史消息设计

## 背景

当前客服工作台在打开会话时只加载最近 5 条历史消息，用户无法查看更早的聊天记录。需要实现滚动到顶部时自动从融云 SDK 加载历史消息的功能。

## 目标

- 用户滚动到消息列表顶部时自动触发历史消息加载
- 每次加载固定 20 条历史消息
- 显示加载中状态提示
- 加载后保持滚动位置不跳动
- 没有更多历史时停止加载

## 架构设计

### 职责划分

**MessageList.vue（UI 层）**
- 监听滚动事件，检测是否接近顶部（scrollTop < 50px）
- 调用 IM store 的加载方法
- 显示加载中提示
- 恢复滚动位置

**IM Store（状态管理层）**
- 维护历史加载状态：`loadingHistory`、`hasMoreHistory`、`oldestTimestamp`
- 提供 `loadMoreHistory()` 方法
- 调用融云 SDK 获取历史消息
- 将新消息插入到 messages 数组开头
- 更新分页状态

**conversation.ts（SDK 封装层）**
- 已有 `getHistory()` 方法，支持 timestamp 参数
- 无需修改

### 数据流

```
用户滚动到顶部
  ↓
MessageList 检测 scrollTop < 50px
  ↓
调用 im.loadMoreHistory()
  ↓
IM Store 检查 loadingHistory 和 hasMoreHistory
  ↓
调用 getHistory(targetId, { timestamp: oldestTimestamp, count: 20 })
  ↓
融云 SDK 返回历史消息
  ↓
messages.unshift(...newMessages)
  ↓
更新 oldestTimestamp = newMessages[0].sentTime
  ↓
MessageList 恢复滚动位置
```

## 详细设计

### 1. IM Store 状态扩展

在 `stores/im.ts` 中添加：

```typescript
const loadingHistory = ref(false)
const hasMoreHistory = ref(true)
const oldestTimestamp = ref(0)
```

### 2. IM Store 加载方法

```typescript
async function loadMoreHistory(): Promise<boolean> {
  if (loadingHistory.value || !hasMoreHistory.value || !currentTargetId.value) {
    return false
  }
  
  loadingHistory.value = true
  try {
    const history = await getHistory(currentTargetId.value, {
      timestamp: oldestTimestamp.value,
      count: 20
    })
    
    if (history.length === 0) {
      hasMoreHistory.value = false
      return false
    }
    
    // 按时间排序后插入到开头
    const sorted = history.sort((a, b) => a.sentTime - b.sentTime)
    messages.value.unshift(...sorted)
    
    // 更新最早消息时间戳
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

### 3. openConversation 初始化状态

修改 `openConversation` 方法，重置历史加载状态：

```typescript
async function openConversation(targetId: string) {
  currentTargetId.value = targetId
  messages.value = []
  loadingHistory.value = false
  hasMoreHistory.value = true
  oldestTimestamp.value = 0
  
  // ... 现有逻辑
  
  const history = await getHistory(targetId, { count: 20 })
  messages.value = history.sort((a, b) => a.sentTime - b.sentTime)
  
  // 设置初始 oldestTimestamp
  if (history.length > 0) {
    oldestTimestamp.value = history[0].sentTime
  }
}
```

### 4. MessageList 滚动监听

在 `MessageList.vue` 中添加：

```typescript
const loading = computed(() => im.loadingHistory)
const hasMore = computed(() => im.hasMoreHistory)

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

onMounted(() => {
  scroller.value?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  scroller.value?.removeEventListener('scroll', handleScroll)
})
```

### 5. 加载状态 UI

在 MessageList 模板顶部添加：

```vue
<div v-if="loading" class="text-center py-2">
  <span class="text-xs text-ink-500">加载中...</span>
</div>
<div v-else-if="!hasMore && messages.length > 0" class="text-center py-2">
  <span class="text-xs text-ink-400">没有更多消息了</span>
</div>
```

## 技术细节

### 滚动位置恢复

加载历史消息后，DOM 高度增加，需要补偿滚动位置：

```typescript
const prevHeight = scroller.scrollHeight  // 加载前总高度
const prevTop = scroller.scrollTop        // 加载前滚动位置

// 加载并渲染新消息
await loadMoreHistory()
await nextTick()

const diff = scroller.scrollHeight - prevHeight  // 新增高度
scroller.scrollTop = prevTop + diff              // 补偿位置
```

### 防抖优化

滚动事件可能频繁触发，通过状态检查避免重复加载：
- `loadingHistory` 为 true 时不触发
- `hasMoreHistory` 为 false 时不触发
- `scrollTop < 50px` 才触发

### 融云 SDK timestamp 参数

融云 `getHistory` 的 `timestamp` 参数：
- 传 0 表示从最新开始获取
- 传具体时间戳表示获取该时间之前的消息
- `order: 0` 表示降序（获取更旧的消息）

### 边界情况

1. **首次加载少于 20 条**：说明历史消息不足 20 条，但可能还有更早的，继续允许加载
2. **返回 0 条**：设置 `hasMoreHistory = false`，停止后续加载
3. **加载失败**：静默处理，不影响现有消息显示，用户可重试（再次滚动到顶部）
4. **切换会话**：`openConversation` 时重置所有状态

## 移除的功能

当前 MessageList 中的窗口化逻辑（`visibleCount`、`loadEarlier` 按钮）将被移除，因为：
- 历史消息从服务端分页加载，不需要本地窗口化
- 滚动加载提供了更自然的交互体验
- 简化组件逻辑

## 测试要点

1. 滚动到顶部时自动触发加载
2. 加载中显示提示，且不重复触发
3. 加载后滚动位置保持稳定
4. 没有更多消息时显示提示并停止加载
5. 切换会话时状态正确重置
6. 加载失败时不影响现有消息

## 后续优化

- 添加加载失败重试按钮
- 预加载优化（接近顶部时提前加载）
- 加载动画优化（骨架屏）
- 性能优化（大量消息时的虚拟滚动）
