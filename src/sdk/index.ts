import { boot, open, openSafe, __version__ } from './open'

const api = { boot, open, openSafe, version: __version__ }

if (typeof window !== 'undefined') {
  ;(window as any).DajiCS = api
}

export { boot, open, openSafe, __version__ as version }
export type { DajiCSBootOptions, OpenOptions, ProductCard } from './types'
