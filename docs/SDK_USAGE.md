# 大集客服 SDK 接入指南

面向第三方站点（如 seo-daji-web）：用最少代码替换 53 客服，支持预投商品卡到对话。

---

## ⚡ 30 秒快速接入

核心场景：**在某个网站中，点击商家客服按钮，携带用户信息和客服信息，打开客服系统。**

```html
<!-- ① 引入 SDK（约 2.4 kB gzip） -->
<script src="https://<cs-host>/daji-cs.iife.js"></script>

<script>
  // ② 初始化（整站只需一次）
  DajiCS.boot({
    baseUrl: 'https://cs.chinamarket.cn', // 大集客服站点根
    apiBase: 'https://api.chinamarket.cn', // 后端 API 根
  })

  // ③ 点击客服按钮时调用
  document.querySelector('#contact-cs').addEventListener('click', () => {
    DajiCS.open({
      userId: '10086', // 当前用户 ID
      userName: '张三', // 用户昵称
      token: '<业务token>', // 宿主业务 token
      supplierId: 'SUPPLIER_001', // 目标商家客服 ID
      language: 'zh', // 语言 zh / en
    })
  })
</script>
```

效果：新开浏览器标签页 → `{baseUrl}/buyer/{supplierId}?daji_userId=...&daji_token=...`，直接进入与该商家的客服对话。

---

## 1. 引入

```html
<script src="https://<cs-host>/daji-cs.iife.js"></script>
```

加载后注入全局 `window.DajiCS`，约 2.4 kB（gzip 1.2 kB），无外部依赖。

## 2. 初始化（整站仅一次）

```js
DajiCS.boot({
  baseUrl: 'https://cs.chinamarket.cn', // 大集客服站点根
  apiBase: 'https://api.chinamarket.cn', // 后端 API 根（/sendRyMessage 所在）
})
```

### Boot 完整配置

| 选项                 | 类型     | 默认值  | 说明                                                                 |
| -------------------- | -------- | ------- | -------------------------------------------------------------------- |
| `baseUrl` _（必填）_ | string   | —       | 大集客服站点根地址                                                   |
| `apiBase` _（必填）_ | string   | —       | 后端 API 根（sendRyMessage 所在域）                                  |
| `debug`              | boolean  | `false` | 调试模式：打印 `[DajiCS]` 内部日志（见[第 8 节](#8-debug-调试模式)） |
| `allowedOrigins`     | string[] | `[]`    | postMessage 白名单 origin（除 baseUrl 外额外允许的源）               |
| `autoCloseOnEnd`     | boolean  | `true`  | 收到 `conversation:end` 后是否自动关闭 widget                        |
| `endCloseDelay`      | number   | `3000`  | 自动关闭前"会话已结束"横幅的显示时长（ms）                           |

## 3. 打开客服窗口

### 3.1 基础

```js
DajiCS.open({
  userId: userStore.id,
  userName: userStore.userName,
  userType: userStore.userType, // 1-5
  language: 'zh', // 或 'en'
  token: userStore.token, // 宿主业务 token
  priceType: userStore.priceType,
  supplierId: targetSupplierId, // 目标客服 peerId
})
```

行为：新开标签页 → `{baseUrl}/buyer/{supplierId}?daji_userId=...&daji_supplierId=...&...`。浏览器自动复用同名窗口，重复调用只会刷新/聚焦已有标签。

### 3.2 预投商品卡

```js
DajiCS.open({
  ...identity,
  card: {
    title: '精品大枣 5kg',
    imgUrl: 'https://cdn.xxx/sku-9999.jpg',
    spuId: 'SPU_9999',
    intr: '新鲜直供', // 简介
    notes: '满 2 件包邮', // 备注
    jumpUrl: 'https://xxx/product/9999',
  },
})
```

流程：先 `POST {apiBase}/sendRyMessage` 预投一条自定义消息（`objectName = DAJI:ProductCard`），**不阻塞开窗**；预投失败只打 warn，窗口仍打开。

### 3.3 兜底入口

网络抖动 / apiBase 故障时用：

```js
DajiCS.openSafe(options) // 跳过预投，直接开窗
```

## 4. 可配置项（OpenOptions）

| option                      | 类型             | 说明                                             |
| --------------------------- | ---------------- | ------------------------------------------------ |
| `userId` _（必填）_         | string \| number | 宿主用户 id                                      |
| `userName`                  | string           | 昵称，显示用                                     |
| `userType`                  | number           | 用户类型 1-5                                     |
| `language`                  | string           | `zh` / `en`，会写入对端默认翻译语言              |
| `token`                     | string           | 宿主业务 token，下发到客服站点当 `auth_token` 用 |
| `priceType`                 | string           | 价格体系标识                                     |
| `supplierId` _（建议必填）_ | string \| number | 目标客服 peerId                                  |
| `card`                      | object           | 预投商品卡（见 3.2）                             |

### ProductCard 字段

| 字段      | 类型             | 必填 | 说明             |
| --------- | ---------------- | ---- | ---------------- |
| `title`   | string           | ✅   | 商品标题         |
| `imgUrl`  | string           | ✅   | 商品主图 URL     |
| `spuId`   | string \| number | —    | SPU 标识         |
| `intr`    | string           | —    | 简介             |
| `notes`   | string           | —    | 备注             |
| `jumpUrl` | string           | —    | 点击卡片跳转 URL |

## 5. 事件监听

SDK 提供完善的事件系统，支持 `on` / `once` / `off` 三种订阅方式。

### 基本用法

```js
// 持续订阅
const unsub = DajiCS.on('window:open', (payload) => {
  console.log('客服窗口已打开', payload.url)
})

// 一次性订阅
DajiCS.once('ready', () => {
  console.log('SDK 已就绪')
})

// 取消订阅（方式一：调用返回的取消函数）
unsub()

// 取消订阅（方式二：传入原始回调）
function handler(payload) {
  /* ... */
}
DajiCS.on('presend:success', handler)
DajiCS.off('presend:success', handler)
```

### 事件列表

| 事件名             | Payload                       | 说明                     |
| ------------------ | ----------------------------- | ------------------------ |
| `ready`            | `void`                        | SDK boot 完成触发一次    |
| `window:open`      | `{ key, url }`                | 成功打开客服标签页       |
| `window:focus`     | `{ key, url }`                | 复用已有客服窗口（聚焦） |
| `window:close`     | `{ key }`                     | 客服窗口被关闭           |
| `presend:start`    | `{ clientMsgId, card, opts }` | 开始预投商品卡           |
| `presend:success`  | `{ clientMsgId }`             | 预投成功                 |
| `presend:error`    | `{ clientMsgId, error }`      | 预投失败（已达重试上限） |
| `unread:change`    | `{ count }`                   | 未读消息数变化           |
| `message:incoming` | `{ from, preview? }`          | 客服侧有新消息           |
| `conversation:end` | `{ reason? }`                 | 会话被客服结束           |
| `launcher:mount`   | `{ position }`                | Launcher 气泡挂载完成    |
| `launcher:click`   | `{ mode }`                    | 用户点击 Launcher 气泡   |
| `launcher:unmount` | `void`                        | Launcher 气泡被卸载      |
| `widget:open`      | `{ url }`                     | iframe Widget 打开       |
| `widget:close`     | `{ reason }`                  | iframe Widget 关闭       |
| `error`            | `{ source, error }`           | 未分类错误               |

### 典型场景示例

```js
// 监听预投结果
DajiCS.on('presend:error', ({ clientMsgId, error }) => {
  console.warn(`商品卡 ${clientMsgId} 预投失败`, error)
})

// 监听未读数，更新页面角标
DajiCS.on('unread:change', ({ count }) => {
  document.querySelector('.badge').textContent = count > 0 ? count : ''
})

// 监听会话结束，弹出满意度评价（配合 autoCloseOnEnd: false）
DajiCS.on('conversation:end', ({ reason }) => {
  showSatisfactionSurvey()
})
```

## 6. URL Query 约定

SDK 把 options 序列化成带 `daji_` 前缀的 query，客服站点 `/buyer/:supplierId` 路由读取：

```
?daji_userId=...&daji_userName=...&daji_userType=...
 &daji_language=...&daji_token=...&daji_priceType=...
 &daji_supplierId=...&daji_host=<调用方域名>&daji_sdkv=<SDK版本>
```

与老 53 方案命名兼容，便于后端日志对齐。

## 7. 替换节奏（推荐）

宿主站点用环境变量开关并存：

```js
const useNewCS = runtimeConfig.public.useDajiNewCS
if (useNewCS) DajiCS.open(params)
else CustomerService.openFixedServiceWindow(params)
```

观察 2-4 周后删除老代码。

## 8. Debug 调试模式

在 `boot()` 时开启 `debug: true`，SDK 会在控制台输出 `[DajiCS]` 前缀的内部日志，方便排查问题：

```js
DajiCS.boot({
  baseUrl: 'https://cs.chinamarket.cn',
  apiBase: 'https://api.chinamarket.cn',
  debug: true, // 开启调试日志
})
```

Debug 模式会输出以下信息：

- **boot 配置**：初始化参数确认
- **窗口操作**：`open()` / `openSafe()` 的目标 URL
- **预投过程**：请求发送、重试、成功/失败详情
- **Bridge 通信**：postMessage 收发记录
- **窗口复用**：同名窗口检测与聚焦

此外可在运行时检查 SDK 内部状态（调试用 API）：

```js
DajiCS.isBridgeActive() // bridge 是否启动
DajiCS.getAllowedOrigins() // 当前 postMessage 白名单
DajiCS.isReadyNow() // SDK 是否已 boot
DajiCS.version // SDK 版本号
```

## 9. 本地调试

大集客服仓库自带 demo：

```bash
pnpm build:sdk        # 产出 dist/sdk/daji-cs.iife.js
pnpm dev              # 起 dev server
# 浏览器开 http://localhost:5173/sdk-demo.html
```

## 10. 安全说明

### Token 传输

- **v1（当前）**：token 明文随 URL query 下发（与老方案一致），依赖 HTTPS + 短有效期
- **v2 规划**：宿主服务端换一次性 rc-token，URL 只带短 token；本期不做

### postMessage Origin 校验

SDK 内建 postMessage 双向桥（`bridge.ts`），**严格校验消息来源**：

1. **自动白名单**：`boot({ baseUrl })` 时自动提取 `baseUrl` 的 origin 加入白名单
2. **扩展白名单**：通过 `allowedOrigins` 追加额外允许的源
3. **校验流程**：收到 `message` 事件后，SDK 首先检查 `event.origin ∈ 白名单`，再验证 `data.source === 'daji-cs'` 且 `type` 为预期字符串，否则直接丢弃
4. **发送侧**：`sendToWidgetIframe()` / `sendToOpenWindow()` 默认使用白名单首项作为 `targetOrigin`，避免使用 `*` 通配符；若降级到 `*` 会输出 console.warn 提醒

```js
// 示例：需要额外允许来自测试环境的消息
DajiCS.boot({
  baseUrl: 'https://cs.chinamarket.cn',
  apiBase: 'https://api.chinamarket.cn',
  allowedOrigins: ['https://cs-staging.chinamarket.cn'],
})
```

### Query 安全

`/buyer/:supplierId` 路由对所有 `daji_*` query 做白名单过滤，非法字段直接忽略。

## 11. 版本

- SDK 产物：`dist/sdk/daji-cs.iife.js`
- 当前版本：`0.1.0`
- 获取版本：`DajiCS.version`

## 12. 相关文档

- 架构设计：[SDK_DESIGN.md](./SDK_DESIGN.md)
- 后端待办：[BACKEND_QUESTIONS.md](./BACKEND_QUESTIONS.md)
