<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import Toast from '@/components/Toast.vue'
import { useAuthStore } from '@/stores/auth'
import { useImStore } from '@/stores/im'
import { isEmbedded, onParentMessage } from '@/utils/embed-bridge'

const auth = useAuthStore()
const im = useImStore()

let offParentMsg: (() => void) | null = null

/**
 * 处理宿主 SDK 下发的 daji:identity：把新 token 写入 localStorage，
 * 然后按原有流程重建认证 + RC 连接。
 *
 * payload 形态（SDK 侧 refreshIdentity 约定）：
 *   { token?: string, language?: string, userId?: string, supplierId?: string }
 *
 * 默认策略：断开 → bootstrap → 重连，清空内存中的消息列表（RC 会话历史仍可通过
 * getHistory 重新拉取）。若宿主需要"无感保留 UI"，可在此拦截不 disconnect，
 * 直接用新 token 调 RC.reconnect（需后端支持）。
 */
async function handleIdentity(payload: unknown) {
  const p = (payload ?? {}) as Record<string, unknown>
  const token = typeof p.token === 'string' ? p.token : ''
  if (!token) return
  const tokenKey = auth.getAuthTokenKey()
  localStorage.setItem(tokenKey, token)
  try {
    im.disconnect()
    await auth.bootstrapUser()
    if (auth.rcToken) {
      await im.connect(auth.rcToken)
    }
  } catch (e) {
    console.warn('[DajiCS] identity refresh failed:', e)
  }
}

onMounted(async () => {
  await auth.bootstrap()
  if (auth.rcToken) {
    im.connect(auth.rcToken).catch((e) => {
      console.warn('RC connect failed on bootstrap:', e)
    })
  }

  // iframe 嵌入场景：监听 parent 补发的 identity / ping 等控制消息
  if (isEmbedded()) {
    offParentMsg = onParentMessage((type, payload) => {
      if (type === 'daji:identity') handleIdentity(payload)
      // daji:ping 可留作健康检查，当前 no-op
    })
  }
})

onUnmounted(() => {
  offParentMsg?.()
  offParentMsg = null
})
</script>

<template>
  <router-view />
  <ImageLightbox />
  <Toast />
</template>
