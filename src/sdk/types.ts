export interface DajiCSBootOptions {
  /** 大集客服站点根，如 https://cs.chinamarket.cn */
  baseUrl: string
  /** 后端 API 根（sendRyMessage 所在域） */
  apiBase: string
  /** 可选：SDK 版本号，随 query 下发，排查用 */
  version?: string
  /** 调试模式：打印内部日志（重试 / 窗口复用等） */
  debug?: boolean
  /**
   * postMessage 白名单 origin 列表（除 baseUrl origin 外额外允许）。
   * 仅此白名单内的 origin 能通过 bridge 向 SDK 发消息。
   */
  allowedOrigins?: string[]
}

export interface ProductCard {
  title: string
  imgUrl: string
  intr?: string
  notes?: string
  spuId?: string | number
  jumpUrl?: string
}

export interface OpenOptions {
  userId: string | number
  userName?: string
  userType?: number
  language?: string
  token?: string
  priceType?: string
  supplierId?: string | number
  card?: ProductCard
  /** 透传给 window.open 的特性串，默认 `width=1000,height=600,scrollbars=yes,resizable=yes` */
  windowFeatures?: string
}
