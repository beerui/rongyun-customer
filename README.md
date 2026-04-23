# daji-customer-service

基于 Vue 3 + 融云 IM 的客服系统仓库，当前包含两部分能力：

- 客服业务前端（PC 客服端、PC 用户端、H5 用户端）
- 可对外集成的客服 SDK（`src/sdk`，支持 ESM/CJS/IIFE）

## 技术栈

Vue 3、Vite、TypeScript、Pinia、Vue Router、Tailwind CSS、Axios、`@rongcloud/imlib-next`

## 环境要求

- Node.js >= 18
- pnpm >= 8

## 快速开始

```bash
cp .env.example .env.development
pnpm install
pnpm dev
```

默认访问地址：`http://localhost:5173`

## 常用命令

```bash
# 本地开发
pnpm dev

# 生产构建（含类型检查）
pnpm build

# 本地预览
pnpm preview

# 代码检查与格式化
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
```

## SDK 构建命令

```bash
# 一次性构建 SDK（lib + iife + package 元数据）
pnpm build:sdk

# 分步构建
pnpm build:sdk:lib
pnpm build:sdk:iife
pnpm build:sdk:meta

# 打包 dist/sdk 为 tgz
pnpm pack:sdk
```

SDK 使用说明见：[`src/sdk/README.md`](./src/sdk/README.md)  
示例工程见：[`examples/vite-project`](./examples/vite-project)

## 路由入口

| 路径           | 说明                     |
| -------------- | ------------------------ |
| `/`            | PC 用户端聊天页          |
| `/agent/login` | 客服登录页（含快捷账号） |
| `/agent`       | PC 客服工作台            |
| `/m`           | H5 用户端聊天页          |
| `/m/intro`     | H5 平台介绍页            |

说明：

- 路由守卫会按设备类型自动分流
- 移动端不可访问 `/agent`
- `/agent` 需要登录态

## 主要功能

### 客服工作台

- 会话列表（筛选、搜索、状态标识）
- 会话聊天区（消息流、输入区、工具栏）
- 会话操作（转接、挂起、结束）
- 用户信息侧栏（基础资料、标签、统计）

### 消息能力

- 文本消息（失败可重发）
- 表情插入（光标位置插入）
- 图片 / 视频 / 文件消息（先上传后发送）
- 自定义消息兼容展示（含未知类型兜底）

### 访客接入

- 首次访问自动生成 `guest_uuid`
- 调用后端换取融云 Token
- 后端不可用时可降级为 mock 凭证，保障联调可继续

## 会话模式切换

默认是 1v1 私聊（`private`），若后端切到群会话可通过配置切换：

```ts
import { setConversationKind } from '@/im'

setConversationKind('group')
```

UI 层无需改动，`stores` 与组件以统一 `targetId` 抽象。

## 项目目录（核心）

```text
src/
  apis/              # 业务接口
  components/        # 通用组件
  im/                # 融云相关封装
  pages/             # 页面（pc / mobile）
  router/            # 路由
  sdk/               # 对外客服 SDK
  stores/            # Pinia 状态管理
  utils/             # 工具方法
docs/                # 设计文档与接口记录
examples/            # SDK 接入示例
```

## 环境变量

以 `.env.example` 为基准，开发环境可使用 `.env.development`：

| 变量             | 说明              |
| ---------------- | ----------------- |
| `VITE_RC_APPKEY` | 融云 AppKey       |
| `VITE_API_BASE`  | 后端 API 基础地址 |
| `VITE_OSS_BASE`  | OSS 域名（可选）  |

## 默认测试账号

| 账号     | 密码     |
| -------- | -------- |
| `lianp`  | `123456` |
| `xiaoyi` | `123456` |

## 相关文档

- 变更记录：[`CHANGELOG.md`](./CHANGELOG.md)
- IM 集成设计：[`docs/superpowers/specs/2026-04-17-rongcloud-im-integration-design.md`](./docs/superpowers/specs/2026-04-17-rongcloud-im-integration-design.md)
