<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isEmbedded, sendToParent } from '@/utils/embed-bridge'
import { setDefaultLang } from '@/utils/translate-langs'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  const q = route.query as Record<string, string | undefined>

  // 宿主业务 token → 走 http 拦截器的 Authorization
  if (q.daji_token) localStorage.setItem('user_auth_token', String(q.daji_token))
  if (q.daji_language) setDefaultLang(String(q.daji_language))

  // 上下文信息（SDK 来源、外部用户、商户等），留痕排查用
  const ctx = {
    host: q.daji_host ?? '',
    sdkv: q.daji_sdkv ?? '',
    userType: q.daji_userType ?? '',
    priceType: q.daji_priceType ?? '',
    extUserId: q.daji_userId ?? '',
    extUserName: q.daji_userName ?? '',
  }
  localStorage.setItem('daji_sdk_ctx', JSON.stringify(ctx))

  try {
    await auth.bootstrapUser()
  } catch (e) {
    console.warn('[DajiCS entry] bootstrapUser failed:', e)
  }

  // 强制指定目标客服（宿主通过 supplierId 指定）
  if (q.daji_supplierId) {
    auth.peerId = String(q.daji_supplierId)
  }

  // 若是 iframe 嵌入（SDK Launcher 模式），通知 parent 已就绪
  if (isEmbedded()) {
    sendToParent('daji:ready', {
      userId: q.daji_userId ?? '',
      supplierId: q.daji_supplierId ?? '',
    })
  }

  // 进入 PC/移动端 UserChat，router guard 会自动适配
  router.replace({ path: '/', query: {} })
})
</script>

<template>
  <div class="h-screen w-screen flex items-center justify-center text-sm text-gray-500">正在接入客服...</div>
</template>
