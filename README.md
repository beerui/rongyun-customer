# l-agent · 融云 IM 客服系统

一套代码承载 **PC 客服工作台 / PC 用户端 / H5 用户端** 三端的轻量聊天系统。

## 技术栈

Vue 3 + Vite + TypeScript + Pinia + vue-router + Tailwind CSS + `@rongcloud/imlib-next`

## 快速开始

```bash
cp .env.example .env     # 填入 VITE_RC_APPKEY / VITE_API_BASE / VITE_OSS_BASE
pnpm i
pnpm dev                 # http://localhost:5173
pnpm build
```

## 路由

| 路径             | 说明                                       |
| ---------------- | ------------------------------------------ |
| `/`              | PC 用户端（左聊天 + 右平台介绍）            |
| `/agent/login`   | PC 客服登录                                 |
| `/agent`         | PC 客服工作台（四栏：侧栏/会话/聊天/用户信息）|
| `/m`             | 移动端用户聊天（UA 自动重定向）             |
| `/m/intro`       | 移动端平台介绍                              |

路由守卫按设备类型自动分流；移动端无法访问 `/agent`；`/agent` 需要已登录。

## 目录

```
src/
  im/          # 融云 SDK 封装（client/events/conversation/parse/types）
  stores/      # Pinia（auth/im/conversations）
  apis/        # 后端接口
  components/  # 共享原子组件（Tailwind）
  pages/
    pc/user/ pc/agent/ mobile/user/
  router/
  utils/
```

## 会话模式

默认 **1v1 私聊**（`ConversationKind='private'`）。后端"一客一群"方案就绪后，在应用启动处调用：

```ts
import { setConversationKind } from '@/im'
setConversationKind('group')
```

无需修改 UI 层代码，`stores/im` 与组件对 `targetId` 的使用均为通用抽象。

## 设计文档

`docs/superpowers/specs/2026-04-17-rongcloud-im-integration-design.md`
