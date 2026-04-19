import { boot, open, openSafe, close, reset, ready, isReadyNow, buildChatUrl, __version__ } from './open'
import { on, off, once } from './events'
import { mountLauncher, unmountLauncher, setUnreadCount, toggleWidget, getLauncherElement } from './launcher/launcher'
import { openWidget, closeWidget, isWidgetOpen, getWidgetIframe } from './launcher/widget'

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
  // C 阶段新增
  mountLauncher,
  unmountLauncher,
  setUnreadCount,
  toggleWidget,
  openWidget,
  closeWidget,
  isWidgetOpen,
  buildChatUrl,
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
  __version__ as version,
}
export { HttpError, TimeoutError, fetchWithRetry, defaultShouldRetry } from './utils/fetch-with-retry'
export { EventEmitter } from './utils/event-emitter'
export type { DajiCSBootOptions, OpenOptions, ProductCard } from './types'
export type { DajiCSEventMap, DajiCSEventType, DajiCSListener } from './events'
export type { LauncherOptions, LauncherPosition, LauncherMode } from './launcher/launcher'
export type { WidgetState, WidgetPosition } from './launcher/widget'
export type { Listener, Unsubscribe } from './utils/event-emitter'
