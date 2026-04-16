# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 风格，日期格式 YYYY-MM-DD。

## [Unreleased]

### Added
- 消息输入：表情面板（常用 emoji）、图片 / 视频 / 文件选择与上传
- 融云消息类型补全：`sendVideo`（SightMsg）、`sendFile`（FileMsg）；`Message.type` 新增 `'video'`
- 消息气泡：原生视频播放、图片点击查看、文件名+体积展示
- 消息重发：`imStore.retry(id)` 点击失败气泡重试（文本消息）
- 客服工作台会话操作：挂起 / 转接（含客服选择弹窗）/ 结束会话；`apis/customer.ts` 暴露对应接口
- 访客端入口：访问 `/` 或 `/m` 自动生成并持久化 `guest_uuid`，调用 `getRyToken`；后端未就绪时以 mock 凭证跑通 UI
- 上传工具 `src/utils/upload.ts`：统一抽象 `uploadImage/uploadVideo/uploadFile`，优先走后端统一上传接口，失败时回退 dataURL / objectURL 预览
- 表情常量 `src/utils/emoji.ts`

### Changed
- `stores/im` 重构消息发送：统一 optimistic 入列 + 失败标记；图片/视频/文件先走 upload 拿 url 再调 SDK
- `bootstrapUser` 改为传入 `uuid` 访问 getRyToken；错误时自动降级为 mock 访客
- `connect(token)`：`mock-` 前缀 token 跳过真实连接，用于后端未就绪的预览

### Fixed
- 登录成功后卡在登录页：拦截器放开成功码 `100`；响应字段 `ryToken/nickname/token/userId` 映射到内部模型
- 刷新 `/agent` 丢登录态：`agent_session` 持久化到 localStorage
- MasterGo 设计色系错配：主色纠正为 `#FA3E3E`；左列激活态、气泡色、工具栏位置等按 DSL 坐标还原

## [0.1.0] - 2026-04-17

### Added
- 项目脚手架：Vue 3 + Vite + TypeScript + Tailwind（无 UI 框架）
- 融云 SDK 薄封装 `src/im/`：client / events / conversation / parse / types
- Pinia stores：auth / im / conversations
- 共享组件：ChatPanel / MessageList / MessageBubble / MessageInput / ConversationItem / Avatar / EmptyState
- 三端页面：PC 客服工作台 / PC 用户端 / H5 用户端
- 路由 UA 分流 + 客服路由守卫
- 后端接入：login / getRyToken（真实后端 `customer-service-dev.sdpjw.cn`）
- MasterGo MCP 接入，按 DSL 还原设计
