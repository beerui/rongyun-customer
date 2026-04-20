import * as RC from '@rongcloud/imlib-next'

/**
 * 自定义卡片消息（商品 / 订单 / 优惠券）。
 *
 * 背景：TextMessage 只序列化 `content/extra/user` 三个标准字段，
 * 自定义顶层字段（如 customType、data）不会随消息上下行，接收端取不到。
 * 解决：通过 `registerMessageType` 注册专属 objectName `DAJI:Card`，
 * content 整体作为自定义消息体透传。
 */

export const DAJI_CARD_OBJECT_NAME = 'DAJI:Card'

export interface DajiCardContent {
  customType: 'product' | 'order' | 'coupon'
  data: Record<string, any>
}

let Ctor: (new (content: DajiCardContent) => RC.BaseMessage<DajiCardContent>) | null = null

/**
 * 注册 DAJI:Card 自定义消息类型。必须在 `RC.init(...)` 之后调用；
 * 发送端与接收端都需要注册，否则接收端无法解析 content。
 */
export function registerDajiCardMessage() {
  if (Ctor) return Ctor
  Ctor = RC.registerMessageType<DajiCardContent>(
    DAJI_CARD_OBJECT_NAME,
    true,   // isPersited：持久化，历史消息能拉到
    true,   // isCounted：计入未读数，和普通消息一样唤起对端注意
  )
  return Ctor
}

export function buildDajiCardMessage(content: DajiCardContent) {
  if (!Ctor) {
    throw new Error('DAJI:Card not registered; call registerDajiCardMessage() after RC.init()')
  }
  return new Ctor(content)
}
