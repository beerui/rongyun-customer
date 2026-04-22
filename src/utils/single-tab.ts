import { BroadcastChannel } from 'broadcast-channel'
import { singleTabLogger } from './logger'

const CHANNEL_NAME = 'daji-visitor-tab'
const HANDSHAKE_TIMEOUT_MS = 200

type TabMessage = { type: 'PING' } | { type: 'PONG' } | { type: 'TAKEOVER' }

export function initSingleTab(onConflict: () => void): () => void {
  const channel = new BroadcastChannel<TabMessage>(CHANNEL_NAME)
  let conflicted = false
  let isActive = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const probeListener = (msg: TabMessage) => {
    if (msg?.type === 'PONG' && !conflicted) {
      conflicted = true
      if (timer) clearTimeout(timer)
      channel.removeEventListener('message', probeListener)
      singleTabLogger.info('检测到旧标签页，通知其关闭')
      // 新标签页接管，通知老标签页关闭
      channel.postMessage({ type: 'TAKEOVER' })
      isActive = true
      setupActiveTab()
    }
  }
  channel.addEventListener('message', probeListener)

  singleTabLogger.debug('发送 PING 探测其他标签页')
  channel.postMessage({ type: 'PING' })

  timer = setTimeout(() => {
    if (conflicted) return
    channel.removeEventListener('message', probeListener)
    singleTabLogger.info('未发现其他标签页，本页转为主标签页')
    isActive = true
    setupActiveTab()
  }, HANDSHAKE_TIMEOUT_MS)

  function setupActiveTab() {
    channel.addEventListener('message', (msg: TabMessage) => {
      if (msg?.type === 'PING') {
        singleTabLogger.debug('收到 PING，回复 PONG')
        channel.postMessage({ type: 'PONG' })
      } else if (msg?.type === 'TAKEOVER') {
        // 收到新标签页的接管通知，尝试自动关闭
        singleTabLogger.warn('新标签页已打开，尝试关闭本页')
        isActive = false

        // 尝试自动关闭（仅对脚本打开的窗口有效）
        setTimeout(() => {
          window.close()
          // 如果 100ms 后还没关闭，说明浏览器阻止了，显示引导遮罩
          setTimeout(() => {
            if (!window.closed) {
              onConflict()
            }
          }, 100)
        }, 50)
      }
    })
  }

  return () => {
    if (timer) clearTimeout(timer)
    channel.close()
    singleTabLogger.debug('清理单标签页资源')
  }
}
