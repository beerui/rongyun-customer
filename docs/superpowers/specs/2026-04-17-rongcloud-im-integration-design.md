# 融云 IM 接入 — 前端设计

日期：2026-04-17
状态：Draft

## 1. 目标

搭建一个轻量前端项目，一套代码同时承载：

- PC 客服工作台（三栏：会话列表 / 聊天区 / 用户信息）
- PC 用户端（左侧聊天窗 + 右侧平台介绍，隐藏分组列表）
- H5 用户端（全屏聊天）

底层使用融云 IM SDK（`@rongcloud/imlib-next`），所有会话走群组（`ConversationType.GROUP`），发消息直连 SDK。

## 2. 技术栈

- Vue 3 + Vite + TypeScript
- Pinia、vue-router
- Tailwind CSS（不引入 UI 框架）
- `@rongcloud/imlib-next` ^5.18
- `axios`（仅业务后端接口）

## 3. 架构

单 SPA、单构建产物。入口 UA 检测 → 跳 `/` (PC) 或 `/m` (移动端)。客服路由 `/agent/*` 仅 PC 可访问。

```
src/
  im/            融云 SDK 封装（client/events/group/types）
  stores/        pinia（auth/im/conversations）
  apis/          业务接口（auth/im）
  components/    共享原子组件
  pages/
    pc/user/
    pc/agent/
    mobile/user/
  router/
  utils/device.ts
```

## 4. 融云封装（薄层）

`im/` 只做能力封装，不持状态。暴露：

- `initIM(appkey)`、`connectIM(token)`、`disconnectIM()`
- `onMessage / onConversationChange / onConnectionStatus`（均返回 unsubscribe）
- `getGroupHistory / sendTextToGroup / sendImageToGroup / clearUnread / getGroupConversationList`
- 统一 `Message` 模型（text / image / file / custom），消息 `status: sending | sent | failed`

## 5. 登录与 Token

- 用户端：`apis/auth.getUserImToken()` → `{ rcToken, userId, name, avatar, groupId }`，连接后 `joinGroup(groupId)`，聊天窗绑定此 `groupId`
- 客服端：`apis/auth.agentLogin()` → `{ rcToken, agentId, name, avatar, groups[] }`，连接后拉群列表，默认选中第一个
- token 过期 → 刷新并重连
- 连接状态条：`disconnected` 红 / `connecting` 黄 / `connected` 隐藏

> **后端前置依赖**：一客一群模型要求用户首次进站时，后端创建群并把用户+客服加入群组，前端只接收 `groupId` 使用。

## 6. 页面

### PC 客服工作台 `/agent`
三栏：左 `w-[280px]` 会话列表 + 中 `flex-1` 聊天区 + 右 `w-[320px]` 用户信息。

### PC 用户端 `/`
两栏：左 `w-[380px]` 聊天窗 + 右 `flex-1` 平台介绍（静态内容）。

### H5 用户端 `/m`
全屏聊天；`/m/intro` 平台介绍，底部 tab 切换。

### 共享组件
`ChatPanel / MessageList / MessageBubble / MessageInput / Avatar / ConversationItem / EmptyState`。
`MessageInput` 通过 `variant="mobile|desktop"` 控制差异。

## 7. 消息流

- 发送：乐观更新 → 临时 msg `status: sending` 入列 → SDK 回包替换为真实 msg 或标红 `failed`
- 接收：`onMessage` 过滤 `groupId === currentGroupId` → push + clearUnread；否则更新会话 lastMessage+unread
- 消息类型：`RC:TxtMsg` / `RC:ImgMsg` / `RC:FileMsg` / 自定义 JSON，未知类型兜底

## 8. 测试策略

- `im/` 封装单测（mock SDK）
- `stores/im` 状态机单测
- 页面端到端用手动测试清单

## 9. 环境变量

```
VITE_RC_APPKEY=
VITE_API_BASE=
VITE_OSS_BASE=
```

## 10. 非目标

- 不支持小程序端
- 不接入音视频（RTC）
- 不接入工单 / 机器人 / 技能组
- H5 不提供客服工作台

## 11. 已知限制

- MasterGo 设计图在当前环境无法直接拉取，样式按文字描述做合理近似，后续可按设计图精调
- 一客一群模型需后端配合
