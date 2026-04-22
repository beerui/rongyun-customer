import { BroadcastChannel } from 'broadcast-channel'
import { singleTabLogger } from './logger'

const CHANNEL_NAME = 'daji-visitor-tab'
const HANDSHAKE_TIMEOUT_MS = 200

type TabMessage = { type: 'PING' } | { type: 'PONG' }

export function initSingleTab(onConflict: () => void): () => void {
  const channel = new BroadcastChannel<TabMessage>(CHANNEL_NAME)
  let conflicted = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const probeListener = (msg: TabMessage) => {
    if (msg?.type === 'PONG' && !conflicted) {
      conflicted = true
      if (timer) clearTimeout(timer)
      channel.removeEventListener('message', probeListener)
      singleTabLogger.warn('检测到已有客服标签页，本页将自我屏蔽')
      onConflict()
    }
  }
  channel.addEventListener('message', probeListener)

  singleTabLogger.debug('发送 PING 探测其他标签页')
  channel.postMessage({ type: 'PING' })

  timer = setTimeout(() => {
    if (conflicted) return
    channel.removeEventListener('message', probeListener)
    singleTabLogger.info('未发现其他标签页，本页转为主标签页')

    channel.addEventListener('message', (msg: TabMessage) => {
      if (msg?.type === 'PING') {
        singleTabLogger.debug('收到 PING，回复 PONG')
        channel.postMessage({ type: 'PONG' })
      }
    })
  }, HANDSHAKE_TIMEOUT_MS)

  return () => {
    if (timer) clearTimeout(timer)
    channel.close()
    singleTabLogger.debug('清理单标签页资源')
  }
}
