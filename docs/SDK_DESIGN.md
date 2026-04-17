# 大集客服 SDK 设计（对外接入）

**目标：** 对第三方站点（首个接入方：`seo-daji-web`）提供 SDK，替换现有 53 客服 (`utils/service-utils.js`)，打开大集自研客服窗口，并支持"打开前预投一张商品卡到对话"。

**现状参考：** 老方案通过 `addTalkImgText` 后端接口落库商品卡；本 SDK 走 `POST /sendRyMessage`（Apifox 已定义）实现等价能力。

---

## 1. 分发形态

| 形态 | 产物 | 用法 |
|---|---|---|
| **IIFE（首选）** | `dist/sdk/daji-cs.iife.js` | 宿主 `<script src>` 注入，暴露全局 `window.DajiCS` |
| npm | 后续迭代再加 | — |

Rollup/Vite 单独 config（不进主站 bundle），全局名 `DajiCS`。

## 2. 窗口形态

**新 tab**（沿用老方案）：
- `window.open(url, '_blank', 'width=1000,height=600,scrollbars=yes,resizable=yes')`
- URL 指向大集客服站点 `/chat?...`（已有路由 `/`，会新增 `/chat` 访客入口接受 query）

iframe / 悬浮面板留作 v2，本期不做。

## 3. 公共 API

```ts
interface DajiCSBootOptions {
  baseUrl: string              // 大集客服站点根，如 https://cs.chinamarket.cn
  apiBase: string              // 后端 API 根（sendRyMessage 所在域）
  appKey?: string              // 融云 appKey（若 SDK 端也需发消息再传；默认不需要）
}

interface OpenOptions {
  // 身份（来自宿主 user store）
  userId: string | number
  userName?: string
  userType?: number            // 1-5，用于 userTypeName 映射
  language?: string            // zh/en/...
  token?: string               // 宿主业务 token
  priceType?: string
  supplierId?: string | number // 对应客服的 peerId

  // 预投商品卡（可选）
  card?: {
    title: string
    imgUrl: string
    intr?: string              // 简介 / 事件数据
    notes?: string
    spuId?: string | number
    jumpUrl?: string           // 点击卡片跳转
  }
}

window.DajiCS.boot({ baseUrl, apiBase })
window.DajiCS.open(options: OpenOptions): Promise<void>
window.DajiCS.openSafe(options): void   // 兜底，不预投卡、不依赖 API
```

## 4. 流程

```
host page → DajiCS.open(options)
           │
           ├─(1) 若 options.card 存在：POST {apiBase}/sendRyMessage
           │     载荷见下文 §5，服务端代发一条融云自定义消息到 (fromUser=userId, toUser=supplierId)
           │     失败 → 继续打开窗口（不阻塞），控制台 warn
           │
           └─(2) window.open(`{baseUrl}/chat?` + serializeQuery(options))
                 大集客服站点 /chat 路由读 query → 拉 getRyToken → 连融云 → openConversation
```

## 5. `sendRyMessage` 载荷约定

按 Apifox `MessageReq` 填：

```json
{
  "sendUserId":     "<userId>",
  "sendUserNickname": "<userName>",
  "targetUserId":   "<supplierId>",
  "objectName":     "DAJI:ProductCard",
  "content":        "{\"customType\":\"product\",\"data\":{\"title\":\"...\",\"imgUrl\":\"...\",\"spuId\":\"...\",\"intr\":\"...\",\"notes\":\"...\",\"jumpUrl\":\"...\"}}",
  "chatType":       1,
  "messageType":    100,
  "from":           "sdk"
}
```

- `objectName` 与大集客服内现有 product 卡一致（融云自定义消息 objectName）
- `content` 为 JSON 字符串，结构沿用 `src/im/parse.ts` 中 `customType === 'product'` 的 `content.data` 契约
- 服务端返回 200 即算落库成功；前端不等待消息到达

## 6. URL Query 约定（/chat 路由）

沿用老方案命名，前缀 `daji_`：

| query | 来源 | 说明 |
|---|---|---|
| `daji_userId` | options.userId | 访客 id |
| `daji_userName` | options.userName | |
| `daji_userType` | options.userType | |
| `daji_language` | options.language | |
| `daji_token` | options.token | 宿主业务 token（后端可用来换 rc-token） |
| `daji_priceType` | options.priceType | |
| `daji_supplierId` | options.supplierId | 目标客服 peerId |
| `daji_host` | location.host | 来源站点 |
| `daji_sdkv` | 固定 | SDK 版本号，排查用 |

**安全说明：** v1 URL query 明文带 token（与老方案一致）；v2 规划：宿主调后端换一次性 rc-token，URL 只带短 token。本期不做。

## 7. 兜底

`DajiCS.openSafe(options)` → 不走 `sendRyMessage`、不拉 `get53Style` 等价物，直接拼 URL 打开。用于：
1. `apiBase` 未配置
2. `options.card` 为空
3. 主流程 `open()` 捕获任何异常

## 8. 替换节奏

宿主站点（seo-daji-web）通过环境变量切换：
```js
const useNewCS = runtimeConfig.public.useDajiNewCS
if (useNewCS) DajiCS.open(params)
else CustomerService.openFixedServiceWindow(params)
```

并存 2-4 周观察，再删除老代码。

## 9. 目录结构（本仓库）

```
src/sdk/
  index.ts          # 导出 DajiCS
  boot.ts           # boot() 存全局配置
  open.ts           # open() / openSafe()
  pre-send.ts       # 预投 sendRyMessage
  query.ts          # serializeQuery
  types.ts
vite.sdk.config.ts  # 单独打包 IIFE
docs/SDK_DESIGN.md  # 本文件
```

产物：`dist/sdk/daji-cs.iife.js`（单文件，无外部依赖；用 axios 太重，内部改用 `fetch`）。

## 10. 待后端确认

- [ ] `sendRyMessage` 支持自定义 `objectName` 透传（非内置 RC 类型）
- [ ] `sendRyMessage` 是否需要 `chatId`（老 `MessageReq` 有这字段，不清楚是否必填）
- [ ] 访客侧用什么登录态接入 `getRyToken`（老方案是 uuid；SDK 场景下是否直接用宿主 token 换）
- [ ] 是否提供 `/chat` 路由兜底 `safeServiceUrl`（老方案有）
