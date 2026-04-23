/**
 * IIFE 入口：把所有对外 API 组装成 `window.DajiCS` 全局对象。
 *
 * 仅用于 `<script src="daji-cs.iife.js">` 方式的直接接入。
 * ESM / CJS 用户请使用 `import ... from '@daji/cs-sdk'`（走 src/sdk/index.ts）。
 */
import * as SDK from './index'

const api = {
  boot: SDK.boot,
  open: SDK.open,
  openSafe: SDK.openSafe,
  reset: SDK.reset,
  ready: SDK.ready,
  isReadyNow: SDK.isReadyNow,
  on: SDK.on,
  off: SDK.off,
  once: SDK.once,
  mountLauncher: SDK.mountLauncher,
  unmountLauncher: SDK.unmountLauncher,
  setUnreadCount: SDK.setUnreadCount,
  toggleWidget: SDK.toggleWidget,
  getLauncherElement: SDK.getLauncherElement,
  openWidget: SDK.openWidget,
  closeWidget: SDK.closeWidget,
  isWidgetOpen: SDK.isWidgetOpen,
  getWidgetIframe: SDK.getWidgetIframe,
  buildChatUrl: SDK.buildChatUrl,
  sendToWidgetIframe: SDK.sendToWidgetIframe,
  sendToOpenWindow: SDK.sendToOpenWindow,
  isBridgeActive: SDK.isBridgeActive,
  getAllowedOrigins: SDK.getAllowedOrigins,
  showEndBanner: SDK.showEndBanner,
  hideEndBanner: SDK.hideEndBanner,
  refreshIdentity: SDK.refreshIdentity,
  DAJI_MSG_SOURCE: SDK.DAJI_MSG_SOURCE,
  DAJI_MSG_VERSION: SDK.DAJI_MSG_VERSION,
  version: SDK.version,
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { DajiCS: typeof api }).DajiCS = api
}

export default api
