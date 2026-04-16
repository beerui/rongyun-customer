# l-agent · 融云 IM 客服系统

一套代码承载 **PC 客服工作台 / PC 用户端 / H5 用户端** 的轻量聊天系统，对接融云 IM。

## 技术栈

Vue 3 · Vite · TypeScript · Pinia · vue-router · Tailwind CSS · `@rongcloud/imlib-next` · axios

## 快速开始

```bash
cp .env.example .env.development   # 已带开发环境默认值
pnpm i
pnpm dev                           # http://localhost:5173
pnpm build
```

## 路由

| 路径             | 说明                                      |
| ---------------- | ----------------------------------------- |
| `/`              | PC 用户端（左聊天 + 右平台介绍）          |
| `/agent/login`   | PC 客服登录（带 lianp / xiaoyi 快捷按钮） |
| `/agent`         | PC 客服工作台（顶栏 + 会话列表 + 聊天区 + 用户信息面板）|
| `/m`             | 移动端用户聊天（UA 自动重定向）           |
| `/m/intro`       | 移动端平台介绍                            |

路由守卫按设备类型自动分流；移动端无法访问 `/agent`；`/agent` 需要已登录。

## 目录

```
src/
  im/                融云 SDK 封装
  stores/            Pinia（auth / im / conversations）
  apis/              业务接口（auth / customer / http）
  utils/             upload / emoji / device
  components/        共享原子组件（Tailwind）
  pages/
    pc/user/ pc/agent/ mobile/user/
  router/
```

## 功能

### 客服工作台
- 顶部红色栏：标题 + 在线客服身份 + 4 项 KPI
- 左侧会话列表：过滤（全部/待接入/进行中）+ 搜索 + 分类 tag
- 中间聊天区：会话头（用户信息 + 转接/挂起/结束会话）+ 消息流 + 工具栏 + 输入
- 右侧三卡片：用户基本信息 / 用户画像标签 / 问题分布柱状图

### 消息类型
- 文本：SDK 直发，乐观入列，失败可重发
- 表情：常用 emoji 面板，光标位置插入
- 图片 / 视频 / 文件：先上传（统一上传接口，失败回退本地预览）→ 调 SDK 发送
- 自定义 JSON：兼容老项目 AI 内容，未知类型兜底展示

### 会话操作
- **挂起** → `POST /api/customer/suspend`
- **转接** → `POST /api/customer/transfer`（带客服选择弹窗）
- **结束** → `POST /api/customer/end`

### 访客入口
访问 `/` 即可；首次自动生成 `guest_uuid` 存 localStorage，调 `getRyToken` 换融云 token。
后端此接口未就绪时自动降级为 mock 凭证保证 UI 可见。

## 会话模式

默认 1v1 私聊（`ConversationKind='private'`）。后端"一客一群"方案就绪后：

```ts
import { setConversationKind } from '@/im'
setConversationKind('group')
```

无需改动 UI 层，stores 与组件均以通用 `targetId` 抽象。

## 环境变量（`.env.development`）

| 变量                 | 说明                                      |
| -------------------- | ----------------------------------------- |
| `VITE_RC_APPKEY`     | 融云 AppKey                               |
| `VITE_API_BASE`      | 客服后端域名                              |
| `VITE_OSS_BASE`      | OSS 域名（未使用时可空）                  |
| `VITE_READY_TOKEN`   | 未登录态调 API 的备用 JWT                 |

## 默认测试账号

| 账号   | 密码   |
| ------ | ------ |
| lianp  | 123456 |
| xiaoyi | 123456 |

登录页点"客服 1 / 客服 2"快捷按钮自动填充。

## 变更记录

见 [CHANGELOG.md](./CHANGELOG.md)。

## 设计文档

`docs/superpowers/specs/2026-04-17-rongcloud-im-integration-design.md`
