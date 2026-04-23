/**
 * IIFE 入口：把所有对外 API 组装成 `window.DajiCS` 全局对象。
 *
 * 仅用于 `<script src="daji-cs.iife.js">` 方式的直接接入。
 * ESM / CJS 用户请使用 `import ... from '@daji/cs-sdk'`（走 src/sdk/index.ts）。
 */
import * as SDK from './index'

if (typeof window !== 'undefined') {
  ;(window as unknown as { DajiCS: typeof SDK }).DajiCS = SDK
}

export default SDK
