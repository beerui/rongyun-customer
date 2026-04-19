import { boot, open, openSafe, close, reset, ready, isReadyNow, __version__ } from './open'
import { on, off, once } from './events'

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
  __version__ as version,
}
export { HttpError, TimeoutError, fetchWithRetry, defaultShouldRetry } from './utils/fetch-with-retry'
export { EventEmitter } from './utils/event-emitter'
export type { DajiCSBootOptions, OpenOptions, ProductCard } from './types'
export type { DajiCSEventMap, DajiCSEventType, DajiCSListener } from './events'
export type { Listener, Unsubscribe } from './utils/event-emitter'
