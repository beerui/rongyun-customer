import * as RC from '@rongcloud/imlib-next'
import { registerDajiCardMessage } from './custom-messages'

let initialized = false

export function initIM(appkey: string) {
  if (initialized) return
  RC.init({ appkey })
  registerDajiCardMessage()
  initialized = true
}

export async function connectIM(token: string): Promise<{ userId: string }> {
  const res = await RC.connect(token)
  if (res.code !== RC.ErrorCode.SUCCESS) throw new Error(`RC connect failed: ${res.code} ${res.msg ?? ''}`)
  return { userId: res.data?.userId ?? '' }
}

export function disconnectIM() {
  RC.disconnect()
}

export { RC }
