/**
 * 聊天工具栏按钮权限配置
 * 统一管理工作台和访客端的按钮可见性
 */

export type ToolbarButton =
  | 'emoji'
  | 'image'
  | 'video'
  | 'file'
  | 'order'
  | 'product'
  | 'coupon'
  | 'quick'
  | 'complaint'
  | 'agent'
  | 'platform'

// 工具栏按钮权限配置
export interface ToolbarPermissions {
  emoji: boolean // 表情
  image: boolean // 图片
  video: boolean // 视频
  file: boolean // 文件
  order: boolean // 发订单
  product: boolean // 发商品
  coupon: boolean // 优惠券
  quick: boolean // 快捷话术
  complaint: boolean // 我要投诉
  agent: boolean // 转人工
  platform: boolean // 平台客服
}

/**
 * 会话标签类型（用于工作台根据用户咨询类型判断）
 */
export type ConversationTag = '平台客服' | '供应商客服' | '工作台' | string

/**
 * 获取工具栏按钮权限
 * @param context 上下文信息
 * @returns 各按钮的可见性配置
 */
export function getToolbarPermissions(context: {
  /** 角色：客服 / 访客 */
  role: 'agent' | 'user'
  /** 会话标签（仅工作台有效） */
  conversationTag?: ConversationTag
  /** 客服 ID（用于未来扩展：不同客服有不同权限） */
  agentId?: string
  /** 访客 ID（用于未来扩展：VIP 用户可能有特殊权限） */
  userId?: string
}): ToolbarPermissions {
  const { role, conversationTag } = context

  // 基础权限：所有角色都有的按钮
  const base: ToolbarPermissions = {
    emoji: false,
    image: false,
    video: false,
    file: false,
    order: false,
    product: false,
    coupon: false,
    quick: false,
    complaint: false,
    agent: false,
    platform: false,
  }

  // 客服工作台
  if (role === 'agent') {
    // 客服默认拥有所有按钮
    base.emoji = true
    base.image = true
    base.file = true
    base.order = true
    base.product = true
    base.quick = true
  }

  // 访客端
  if (role === 'user') {
    base.complaint = true
    base.product = true
    base.platform = true
    base.agent = true
    // 预留功能：根据会话标签动态调整
    // if (conversationTag) {
    //   const orderRelatedTags = ['平台客服', '供应商客服', '工作台']
    //   if (orderRelatedTags.includes(conversationTag)) {
    //     base.order = true
    //   }
    // }
  }

  return base
}

/**
 * 工具栏按钮配置（用于渲染）
 */
export interface ToolbarButtonConfig {
  label: string
  action: ToolbarButton
  icon?: string
}

export const TOOLBAR_BUTTONS: Record<ToolbarButton, ToolbarButtonConfig> = {
  emoji: { label: '表情', action: 'emoji', icon: '😊' },
  complaint: { label: '我要投诉', action: 'complaint', icon: '📢' },
  agent: { label: '转人工', action: 'agent', icon: '👤' },
  order: { label: '发订单', action: 'order', icon: '📦' },
  product: { label: '发商品', action: 'product', icon: '🛍️' },
  image: { label: '图片', action: 'image', icon: '🖼️' },
  video: { label: '视频', action: 'video', icon: '🎞️' },
  file: { label: '文件', action: 'file', icon: '📎' },
  coupon: { label: '优惠券', action: 'coupon', icon: '🎟️' },
  quick: { label: '快捷话术', action: 'quick', icon: '⚡' },
  platform: { label: '平台客服', action: 'platform', icon: '🏢' },
}
