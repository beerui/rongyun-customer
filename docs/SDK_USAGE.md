# 大集客服 SDK 接入指南

面向第三方站点（如 seo-daji-web）：用最少代码替换 53 客服，支持预投商品卡到对话。

## 1. 引入

```html
<script src="https://<cs-host>/daji-cs.iife.js"></script>
```

加载后注入全局 `window.DajiCS`，约 2.4 kB（gzip 1.2 kB），无外部依赖。

## 2. 初始化（整站仅一次）

```js
DajiCS.boot({
  baseUrl: 'https://cs.chinamarket.cn',    // 大集客服站点根
  apiBase: 'https://api.chinamarket.cn',   // 后端 API 根（/sendRyMessage 所在）
})
```

## 3. 打开客服窗口

### 3.1 基础

```js
DajiCS.open({
  userId:     userStore.id,
  userName:   userStore.userName,
  userType:   userStore.userType,      // 1-5
  language:   'zh',                    // 或 'en'
  token:      userStore.token,         // 宿主业务 token
  priceType:  userStore.priceType,
  supplierId: targetSupplierId,        // 目标客服 peerId
})
```

行为：新开 tab `→ {baseUrl}/chat?daji_userId=...&daji_supplierId=...&...`。

### 3.2 预投商品卡

```js
DajiCS.open({
  ...identity,
  card: {
    title:   '精品大枣 5kg',
    imgUrl:  'https://cdn.xxx/sku-9999.jpg',
    spuId:   'SPU_9999',
    intr:    '新鲜直供',              // 简介
    notes:   '满 2 件包邮',            // 备注
    jumpUrl: 'https://xxx/product/9999',
  },
})
```

流程：先 `POST {apiBase}/sendRyMessage` 预投一条自定义消息（`objectName = DAJI:ProductCard`），**不阻塞开窗**；预投失败只打 warn，窗口仍打开。

### 3.3 兜底入口

网络抖动 / apiBase 故障时用：

```js
DajiCS.openSafe(options)   // 跳过预投，直接开窗
```

## 4. 可配置项

| option | 类型 | 说明 |
|---|---|---|
| `userId` *（必填）* | string \| number | 宿主用户 id |
| `userName` | string | 昵称，显示用 |
| `userType` | number | 用户类型 1-5 |
| `language` | string | `zh` / `en`，会写入对端默认翻译语言 |
| `token` | string | 宿主业务 token，下发到客服站点当 `auth_token` 用 |
| `priceType` | string | 价格体系标识 |
| `supplierId` *（建议必填）* | string \| number | 目标客服 peerId |
| `card` | object | 预投商品卡（见 3.2） |
| `windowFeatures` | string | 覆盖 `window.open` 第三参数 |

## 5. URL Query 约定

SDK 把 options 序列化成带 `daji_` 前缀的 query，客服站点 `/chat` 路由读取：

```
?daji_userId=...&daji_userName=...&daji_userType=...
 &daji_language=...&daji_token=...&daji_priceType=...
 &daji_supplierId=...&daji_host=<调用方域名>&daji_sdkv=<SDK版本>
```

与老 53 方案命名兼容，便于后端日志对齐。

## 6. 替换节奏（推荐）

宿主站点用环境变量开关并存：

```js
const useNewCS = runtimeConfig.public.useDajiNewCS
if (useNewCS) DajiCS.open(params)
else CustomerService.openFixedServiceWindow(params)
```

观察 2-4 周后删除老代码。

## 7. 本地调试

大集客服仓库自带 demo：

```bash
pnpm build:sdk        # 产出 dist/sdk/daji-cs.iife.js
pnpm dev              # 起 dev server
# 浏览器开 http://localhost:5173/sdk-demo.html
```

## 8. 安全说明

- **v1** token 明文随 URL query 下发（与老方案一致），依赖 HTTPS + 短有效期
- **v2 规划**：宿主服务端换一次性 rc-token，URL 只带短 token；本期不做
- `/chat` 路由对所有 `daji_*` query 做白名单过滤，非法字段直接忽略

## 9. 版本

- SDK 产物：`dist/sdk/daji-cs.iife.js`
- 当前版本：`0.1.0`
- 获取版本：`DajiCS.version`

## 10. 相关文档

- 架构设计：[SDK_DESIGN.md](./SDK_DESIGN.md)
- 后端待办：[BACKEND_QUESTIONS.md](./BACKEND_QUESTIONS.md)
