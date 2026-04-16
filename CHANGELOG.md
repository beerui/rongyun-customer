# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 风格，日期格式 YYYY-MM-DD。

## [Unreleased]

### Added
- **商品卡片 / 订单卡片 / 优惠券**消息类型：融云自定义 TextMessage 承载 `customType` + `data`，`parseRcMessage` 识别并分派到对应气泡渲染
- **`<Drawer>` 抽屉基础组件**：右侧滑入，含 header / body / footer 插槽
- **OrderListDrawer**：按当前用户 ID 展示订单（mock），每单可"发送订单卡片"或"发送此商品"作为商品卡
- **ProductListDrawer**：商品列表（含搜索），点击"发送卡片"推送商品卡到对话
- **CouponDrawer**：优惠券列表，点"发放"推送券卡到对话
- **QuickReplyDrawer**：快捷话术，支持"填入输入框"或"立即发送"
- **composer 共享草稿 store** `src/stores/composer.ts`：其它面板通过 `composer.insert(text)` 把文本写入 `MessageInput`，不需要组件间传递 ref
- `im/conversation.ts` 新增 `sendCustomCard(targetId, 'product'|'order'|'coupon', data)`
- `stores/im.sendCard(kind, data)` 乐观发送；SDK 失败时保留本地渲染（未连接预览场景可用）
- 消息气泡渲染：商品卡 / 订单卡 / 优惠券卡（含价格、库存、门槛、过期时间）

### Changed
- **MessageInput 工具栏按钮条件化**：按当前接入用户的分类 tag 决定"订单列表 / 商品列表"是否显示
  - 退款申请 / 物流异常 / 物流查询 / 账户异常 → 显示"订单列表"
  - 商品咨询 / 优惠问题 → 显示"商品列表"
  - 其它 → 两个都显示
- **UserInfoPanel 工具面板**：快捷工具按钮（发放优惠券 / 查询订单 / 商品列表 / 快捷话术）全部接入抽屉交互
- **UserInfoPanel 智能辅助 Tab**：推荐回复改为"填入 / 立即发送"双按钮
- **UserInfoPanel 用户信息 Tab**：编辑按钮支持就地编辑 7 项信息
- **MessageInput 外部填入**：改用 composer store，支持快捷话术 / AI 推荐回复一键填入

### Removed
- mock 数据中删除了 `u_wq` 重复条目；新增"赵敏"对照商品咨询场景

## [0.2.0] - 2026-04-17

### Changed
- **PC 访客端布局重构**：原两栏 "聊天+介绍" 改为工作台同款结构 — 顶部红色栏 + 中间聊天区（会话头 + 消息流 + 工具栏 + 输入）+ 右侧 `360px` 平台介绍面板
- **移动端输入栏重设**：改为 `[+] [😊] [输入框] [发送]` 单行布局；`+` 展开 4 宫格附件面板，😊 展开 8 列表情面板
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
