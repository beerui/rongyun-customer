<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useImStore } from '@/stores/im'

const router = useRouter()
const auth = useAuthStore()
const im = useImStore()

const account = ref('')
const password = ref('')
const loading = ref(false)
const err = ref('')

async function handleLogin() {
  err.value = ''
  if (!account.value || !password.value) {
    err.value = '请填写账号密码'
    return
  }
  loading.value = true
  try {
    await auth.loginAgent(account.value, password.value)
    await im.connect(auth.rcToken)
    router.replace('/agent')
  } catch (e: any) {
    err.value = e?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-white">
    <div class="w-[400px] bg-white rounded-xl shadow-lg p-8">
      <h1 class="text-xl font-semibold text-gray-800 mb-1">客服工作台</h1>
      <p class="text-sm text-gray-500 mb-6">请使用客服账号登录</p>

      <label class="block mb-4">
        <span class="text-xs text-gray-600">账号</span>
        <input
          v-model="account"
          class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
          placeholder="客服账号"
        />
      </label>
      <label class="block mb-4">
        <span class="text-xs text-gray-600">密码</span>
        <input
          v-model="password"
          type="password"
          class="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
          placeholder="登录密码"
          @keydown.enter="handleLogin"
        />
      </label>

      <div v-if="err" class="text-red-500 text-xs mb-3">{{ err }}</div>

      <button
        class="w-full rounded-md bg-brand-500 hover:bg-brand-600 text-white text-sm py-2.5 disabled:opacity-60"
        :disabled="loading"
        @click="handleLogin"
      >{{ loading ? '登录中…' : '登录' }}</button>
    </div>
  </div>
</template>
