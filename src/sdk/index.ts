import { boot, open, openSafe, close, reset, __version__ } from './open'

const api = { boot, open, openSafe, close, reset, version: __version__ }

if (typeof window !== 'undefined') {
  ;(window as any).DajiCS = api
}

export { boot, open, openSafe, close, reset, __version__ as version }
export { HttpError, TimeoutError, fetchWithRetry, defaultShouldRetry } from './utils/fetch-with-retry'
export type { DajiCSBootOptions, OpenOptions, ProductCard } from './types'
