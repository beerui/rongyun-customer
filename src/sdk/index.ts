import { boot, open, openSafe, close, reset, ready, isReadyNow, buildChatUrl, getOpenWindow, __version__ } from './open'
import { on, off, once } from './events'
import { mountLauncher, unmountLauncher, setUnreadCount, toggleWidget, getLauncherElement } from './launcher/launcher'
import { openWidget, closeWidget, isWidgetOpen, getWidgetIframe } from './launcher/widget'
import { isBridgeActive, getAllowedOrigins, sendToWidgetIframe, sendToOpenWindow, DAJI_MSG_SOURCE, DAJI_MSG_VERSION } from './launcher/bridge'

const api = {
  boot,
  open,
  openSafe,
  close,
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
  openWidget,
  closeWidget,
  isWidgetOpen,
  buildChatUrl,
  getOpenWindow,
  // C2 新增
  sendToWidgetIframe,
  sendToOpenWindow,
  isBridgeActive,
  getAllowedOrigins,
  version: __version__,
}

if (typeof window !== 'undefined') {
  ;(window as any).DajiCS = api
}

export {
  boot,
  open,
  openSafe,
  close,
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
  getOpenWindow,
  sendToWidgetIframe,
  sendToOpenWindow,
  isBridgeActive,
  getAllowedOrigins,
  DAJI_MSG_SOURCE,
  DAJI_MSG_VERSION,
  __version__ as version,
}
export { HttpError, TimeoutError, fetchWithRetry, defaultShouldRetry } from './utils/fetch-with-retry'
export { EventEmitter } from './utils/event-emitter'
export type { DajiCSBootOptions, OpenOptions, ProductCard } from './types'
export type { DajiCSEventMap, DajiCSEventType, DajiCSListener } from './events'
export type { LauncherOptions, LauncherPosition, LauncherMode } from './launcher/launcher'
export type { WidgetState, WidgetPosition } from './launcher/widget'
export type { DajiMessage, DajiMsgType } from './launcher/bridge'
export type { Listener, Unsubscribe } from './utils/event-emitter'
