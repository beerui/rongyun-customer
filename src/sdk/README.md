# @daji/cs-sdk

大集客服 SDK —— 第三方站点一键接入大集在线客服。

- **一行代码打开客服**：`DajiCS.open()` 即可新标签页跳转客服系统
- postMessage 双向桥（严格 origin 白名单）
- 悬浮 Launcher + iframe Widget（移动端自适应全屏）
- 未读数 / 消息 / 会话结束事件透传
- 超时 / 重试 / 幂等 的预投商品卡
- IIFE / ESM / CJS 三形态，内置 TypeScript 声明

---

## 安装

```bash
# 方式 A：npm 包（推荐，ESM / CJS / 含类型）
npm i @daji/cs-sdk

# 方式 B：CDN IIFE（零构建）
<script src="https://cdn.example.com/daji-cs/iife/daji-cs.iife.js"></script>
```

## 快速开始

> 核心场景：用户在商品页 / 商家主页点击"联系客服"按钮 → 新标签页打开客服系统。

### ESM / TypeScript

```ts
import { boot, open } from '@daji/cs-sdk'

// 1. 初始化（页面加载时调用一次）
boot({
  baseUrl: 'https://cs.chinamarket.cn',
  apiBase: 'https://api.chinamarket.cn',
  debug: import.meta.env.DEV,
})

// 2. 绑定按钮 → 点击即打开客服
document.querySelector('#contact-cs')!.addEventListener('click', () => {
  open({
    userId: 'u_123',
    userName: '小明',
    supplierId: 'shop_abc',
  })
})
```

如需同时预投商品卡（如商品详情页的"咨询"按钮），只需传入 `card`：

```ts
open({
  userId: 'u_123',
  supplierId: 'shop_abc',
  card: {
    title: '精品大枣 5kg',
    imgUrl: 'https://cdn.example.com/sku/9999.jpg',
    spuId: 'SPU_9999',
    jumpUrl: 'https://shop.example.com/product/9999',
  },
})
```

### CommonJS

```js
const { boot, open } = require('@daji/cs-sdk')

boot({ baseUrl: '...', apiBase: '...' })

contactBtn.addEventListener('click', () => {
  open({ userId: 'u_123', supplierId: 'shop_abc' })
})
```

### IIFE（`<script>` 直接加载）

纯静态 HTML、无构建工具的站点推荐此方式，加载后通过 `window.DajiCS` 使用。

**步骤 1：准备 SDK 文件**

```bash
# 从本仓库构建产物复制
pnpm build:sdk
cp dist/sdk/iife/daji-cs.iife.js examples/iife-basic/

# 或从 npm 包复制
cp node_modules/@daji/cs-sdk/iife/daji-cs.iife.js ./
```

**步骤 2：引入脚本并初始化**

```html
<!-- ① 在 <body> 底部或 <head> 中引入 SDK -->
<script src="./daji-cs.iife.js"></script>

<!-- ② 初始化（整站只需一次） -->
<script>
  DajiCS.boot({
    baseUrl: 'https://cs.chinamarket.cn', // 客服站点根地址
    apiBase: 'https://api.chinamarket.cn', // 后端 API 根（预投接口所在）
    debug: true, // 开发阶段建议开启，打印 [DajiCS] 调试日志
  })
</script>
```

**步骤 3：按钮绑定打开客服**

```html
<script>
  // 仅打开客服窗口（无商品卡）
  document.querySelector('#contact-cs').addEventListener('click', function () {
    DajiCS.open({
      userId: 'u_123', // 当前用户 ID（必填）
      userName: '张三', // 用户昵称
      supplierId: 'shop_abc', // 目标商家 ID（必填）
      token: '<your-token>', // 宿主业务 token
      language: 'zh', // zh / en
    })
  })

  // 商品详情页：带商品卡预投
  document.querySelector('#ask-product').addEventListener('click', function () {
    DajiCS.open({
      userId: 'u_123',
      supplierId: 'shop_abc',
      token: '<your-token>',
      card: {
        title: '精品大枣 5kg',
        imgUrl: 'https://cdn.example.com/sku/9999.jpg',
        spuId: 'SPU_9999',
        jumpUrl: 'https://shop.example.com/product/9999',
      },
    })
  })
</script>
```

> **完整 IIFE 示例**（包含环境切换、事件日志、Launcher 挂载、未读角标等）见 [`examples/iife-basic/index.html`](../../examples/iife-basic/index.html)：
>
> ```bash
> # 复制 SDK 文件到示例目录后用静态服务器打开
> cp dist/sdk/iife/daji-cs.iife.js examples/iife-basic/
> npx serve examples/iife-basic
> ```

---

## 进阶用法

### 悬浮气泡 + iframe Widget（Launcher 模式）

如果希望在页面右下角常驻一个客服气泡按钮，点击后以 iframe 嵌入方式打开客服面板：

```ts
import { boot, mountLauncher, on } from '@daji/cs-sdk'

boot({
  baseUrl: 'https://cs.chinamarket.cn',
  apiBase: 'https://api.chinamarket.cn',
  debug: import.meta.env.DEV,
})

// 监听未读数，更新页面标题
on('unread:change', ({ count }) => {
  document.title = count > 0 ? `(${count}) 大集商城` : '大集商城'
})

// 挂载悬浮气泡 + iframe widget
mountLauncher({
  position: 'bottom-right',
  primary: '#FA3E3E',
  title: '在线客服',
  mode: 'iframe',
  openWith: { userId: 'u_123', userName: '小明', supplierId: 'shop_abc' },
})
```

### 宿主 token 续期：给已挂载的 iframe widget 下发新身份

```ts
const newToken = await refreshHostAuth()
DajiCS.refreshIdentity({ token: newToken })
// iframe 内的 /chat 会自动 bootstrap + 重连 IM
```

### 会话结束后弹满意度问卷，而不是直接关窗

```ts
boot({ ..., autoCloseOnEnd: false })
on('conversation:end', ({ reason }) => {
  showSatisfactionSurvey()
  setTimeout(() => closeWidget(), 10_000)
})
```

---

## 典型场景

### 商品详情页：点击"咨询"预投商品卡 + 开窗

```ts
askBtn.addEventListener('click', () => {
  DajiCS.open({
    userId: 'u_123',
    supplierId: 'shop_abc',
    card: {
      title: '精品大枣 5kg',
      imgUrl: 'https://cdn.example.com/sku/9999.jpg',
      spuId: 'SPU_9999',
      jumpUrl: 'https://shop.example.com/product/9999',
    },
  })
})
```

预投失败不阻塞开窗（`presend:error` 事件 + 窗口正常弹出）。

---

## API 速查

| 分类     | 函数                                                         | 说明                                                      |
| -------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| 生命周期 | `boot(opts)`                                                 | 初始化（必须先调用）                                      |
|          | `reset(opts?)`                                               | 清状态；默认保留订阅，`{ clearListeners: true }` 彻底清零 |
|          | `ready()` / `isReadyNow()`                                   | boot 完成的 Promise / 同步查询                            |
| 新开窗口 | `open(opts)`                                                 | 可选预投商品卡 → `window.open`                            |
|          | `openSafe(opts)`                                             | 跳过预投直接开                                            |
| 悬浮 UI  | `mountLauncher(opts)`                                        | 气泡按钮 + iframe Widget                                  |
|          | `unmountLauncher()` · `setUnreadCount(n)` · `toggleWidget()` |                                                           |
|          | `openWidget(url)` · `closeWidget()` · `isWidgetOpen()`       |                                                           |
| 桥接     | `sendToWidgetIframe(type, payload)`                          | 向 iframe 下发协议消息                                    |
|          | `sendToOpenWindow(win, type, payload)`                       | 向新开窗口下发                                            |
|          | `refreshIdentity({ token, ... })`                            | 刷新身份（语法糖）                                        |
| 事件     | `on / once / off(event, fn)`                                 | 订阅 / 取消                                               |

完整签名参见 `types/index.d.ts`。

## 事件一览

| 事件                                     | payload                  | 触发时机                    |
| ---------------------------------------- | ------------------------ | --------------------------- |
| `ready`                                  | `void`                   | boot 完成（首次）           |
| `window:open`                            | `{ key, url }`           | 新 tab 打开客服             |
| `window:focus`                           | `{ key, url }`           | 复用已有客服窗口            |
| `window:close`                           | `{ key }`                | 客服窗口被关（1s 轮询探测） |
| `presend:start` · `:success` · `:error`  | `{ clientMsgId, ... }`   | 预投商品卡                  |
| `launcher:mount` · `:click` · `:unmount` | ...                      | 悬浮气泡                    |
| `widget:open` · `:close`                 | `{ url }` / `{ reason }` | iframe widget               |
| `unread:change`                          | `{ count }`              | 未读数变化（iframe 内推）   |
| `message:incoming`                       | `{ from, preview }`      | 客服新消息（iframe 内推）   |
| `conversation:end`                       | `{ reason }`             | 会话被结束                  |
| `error`                                  | `{ source, error }`      | 内部异常兜底                |

## postMessage 协议

所有消息结构统一：

```ts
{ source: 'daji-cs', version: SDK_VERSION, type: 'daji:*', payload: ... }
```

> `SDK_VERSION` 由构建注入，值见 `src/sdk/version.ts`。

| 方向            | type                    | payload                                      |
| --------------- | ----------------------- | -------------------------------------------- |
| iframe → parent | `daji:ready`            | `{ userId, supplierId }`                     |
|                 | `daji:unread`           | `{ count }`                                  |
|                 | `daji:message`          | `{ from, preview }`                          |
|                 | `daji:conversation-end` | `{ reason }`                                 |
|                 | `daji:close`            | `null`                                       |
| parent → iframe | `daji:identity`         | `{ token, language?, userId?, supplierId? }` |
|                 | `daji:ping`             | `null`                                       |

**安全**：收消息时严格校验 `event.origin` 属于白名单（boot 时从 `baseUrl` 推导，用 `allowedOrigins` 补充）。不匹配直接忽略。

## 配置参考

```ts
interface DajiCSBootOptions {
  baseUrl: string // 客服站点根，如 https://cs.example.cn
  apiBase: string // 后端 API 根（预投商品卡等接口）
  version?: string // 随 query 下发，排查用
  debug?: boolean // 打印内部日志（重试 / 复用窗口等）
  allowedOrigins?: string[] // postMessage 白名单（baseUrl origin 已自动加入）
  autoCloseOnEnd?: boolean // 收 conversation:end 后是否自动关 widget（默认 true）
  endCloseDelay?: number // 自动关的延迟 ms（默认 3000）
}
```

## License

UNLICENSED — 内部发布。
