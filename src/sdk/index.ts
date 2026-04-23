import { off, on, once } from './events'
import {
  DAJI_MSG_SOURCE,
  DAJI_MSG_VERSION,
  getAllowedOrigins,
  isBridgeActive,
  sendToOpenWindow,
  sendToWidgetIframe,
} from './launcher/bridge'
import { getLauncherElement, mountLauncher, setUnreadCount, toggleWidget, unmountLauncher } from './launcher/launcher'
import { closeWidget, getWidgetIframe, hideEndBanner, isWidgetOpen, openWidget, showEndBanner } from './launcher/widget'
import { boot, buildChatUrl, isReadyNow, open, openSafe, ready, reset, version } from './open'

/**
 * 语法糖：向 widget iframe 下发新身份（典型：宿主 token 续期后）。
 * 底层等价于 sendToWidgetIframe('daji:identity', payload)。
 * widget 未挂载或 iframe 未就绪时返回 false。
 */
export function refreshIdentity(payload: {
  token?: string
  language?: string
  userId?: string | number
  supplierId?: string | number
}): boolean {
  return sendToWidgetIframe('daji:identity', payload)
}

export {
  boot,
  open,
  openSafe,
  reset,
  ready,
  isReadyNow,
  on,
  off,
  once,
  mountLauncher,
  unmountLauncher,
  setUnreadCount,
  toggleWidget,
  getLauncherElement,
  openWidget,
  closeWidget,
  isWidgetOpen,
  getWidgetIframe,
  buildChatUrl,
  sendToWidgetIframe,
  sendToOpenWindow,
  isBridgeActive,
  getAllowedOrigins,
  showEndBanner,
  hideEndBanner,
  DAJI_MSG_SOURCE,
  DAJI_MSG_VERSION,
  version,
}
export { HttpError, TimeoutError, fetchWithRetry, defaultShouldRetry } from './utils/fetch-with-retry'
export { EventEmitter } from './utils/event-emitter'
export type { DajiCSBootOptions, OpenOptions, ProductCard } from './types'
export type { DajiCSEventMap, DajiCSEventType, DajiCSListener } from './events'
export type { LauncherOptions, LauncherPosition, LauncherMode } from './launcher/launcher'
export type { WidgetState, WidgetPosition } from './launcher/widget'
export type { DajiMessage, DajiMsgType, EndPolicy } from './launcher/bridge'
export type { Listener, Unsubscribe } from './utils/event-emitter'
