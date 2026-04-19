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
  /**
   * 收到 conversation:end 后是否自动关闭 widget。默认 true。
   * 关闭前会在 widget 顶部显示一条"会话已结束"横幅，延迟 endCloseDelay 毫秒后再关。
   * 若宿主希望自行控制关窗时机（例如弹自定义满意度问卷），设 false 并订阅 on('conversation:end')。
   */
  autoCloseOnEnd?: boolean
  /** autoCloseOnEnd 生效时，横幅显示到关窗的延迟（ms）。默认 3000 */
  endCloseDelay?: number
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
