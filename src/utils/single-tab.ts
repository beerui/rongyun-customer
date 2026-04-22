// src/utils/single-tab.ts
import { BroadcastChannel } from 'broadcast-channel'
import { singleTabLogger } from './logger'

let channel: BroadcastChannel<string> | null = null

export function initSingleTab(onForceClose: () => void): void {
  singleTabLogger.info('初始化单标签页管理')

  channel = new BroadcastChannel('daji-visitor-tab')

  channel.onmessage = (msg) => {
    if (msg === 'visitor-tab-opened') {
      singleTabLogger.warn('检测到新标签页，准备关闭当前页')
      onForceClose()
      window.close()
    }
  }

  singleTabLogger.debug('通知其他标签页关闭')
  channel.postMessage('visitor-tab-opened')
}

export function cleanupSingleTab(): void {
  channel?.close()
  channel = null
  singleTabLogger.debug('清理单标签页资源')
}
