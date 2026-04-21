# 大集客服 SDK / 接口对齐 —— 待后端确认清单

> 背景：前端正在落地对外 SDK（替换 53 客服），同时在跟 Apifox 已发布的 8 个接口做对账。以下问题阻塞 SDK 上线与前端联调，烦请答复。

## A. SDK 预投商品卡（走 `/sendRyMessage`）

1. **`objectName` 是否支持自定义值透传**？
   SDK 预投商品卡时计划传 `objectName = "DAJI:ProductCard"`（非 RC 内置类型），`content` 为 JSON 字符串。服务端是否会直接转发给融云？还是必须使用内置 `RC:TxtMsg` 等类型？

2. **`MessageReq.chatId` 是否必填**？
   Apifox schema 里有 `chatId` 字段但无必填标注。SDK 场景下宿主站点没有 chatId 概念，只有 `sendUserId` + `targetUserId`，能否留空？

3. **访客 `getRyToken` 入参**
   Apifox `UserInfoReq` 要求 `{ name, userId, avatar, uuid, sourceFrom }`。
   - `uuid` 对应访客浏览器指纹，OK
   - `userId` 在 SDK 场景下是宿主业务方传进来的外部用户 id（如大集的 userId），是否可以直接作为融云身份标识？还是需要服务端做一次映射？
   - `sourceFrom` 取值范围？SDK 希望传 `"sdk"` 或 `"host:<domain>"`，能否约定？

4. **访客客服窗口兜底 URL**
   老 53 方案里有一个 `safeServiceUrl`（第三方宿主读 runtimeConfig）。大集新方案是否提供等价的"极简兜底页面"？还是前端直接跑 `/chat?...` 就够了（不兜底）？

## B. Apifox 接口对账（非 SDK）

5. **路径前缀**
   Apifox 文档里接口全是裸路径（如 `/login` `/uploadFile`）。
   - 网关真实前缀是什么？前端当前用 `/api/customer/*` 和 `/metaman/*`。
   - 这两套前缀哪一套是正确的？是否需要统一到文档一致？

6. **上传接口**
   - Apifox 定义：`POST /uploadFile`，multipart 字段名 `file`，返回字符串（url）
   - 前端当前：`POST /metaman/api/oss/upload/`
     哪个是线上真实路径？两边返回结构是否一致（前端兼容了 `body.url / body.data / body.fileUrl / 直接字符串` 四种）。

7. **未在 Apifox 出现的 6 个前端接口**
   前端有调用但文档里没有，请确认是"未导出文档"还是"未实现"：
   - `POST /api/customer/suspend` —— 挂起会话
   - `POST /api/customer/transfer` —— 转接客服
   - `POST /api/customer/end` —— 结束会话
   - `POST /api/customer/conversations` —— 客服可选会话列表
   - `POST /api/customer/agents` —— 可转接客服列表
   - `POST /api/business/translate/translate` —— 文本翻译（客服消息翻译功能用）

---

**回复形式**：逐条回答即可，不需要写文档。优先 1-4 条（阻塞 SDK），5-7 条可晚一天。
**联调期望**：本周内给出 1-4 条结论，下周进入 SDK 联调。
