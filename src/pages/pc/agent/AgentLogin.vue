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
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-bg-app">
    <div class="w-[420px] bg-white rounded-2xl shadow-card p-10">
      <div class="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center text-white text-xl mb-4">💬</div>
      <h1 class="text-[20px] font-semibold text-ink-900 mb-1">智能客服工作台</h1>
      <p class="text-xs text-ink-600 mb-8">请使用客服账号登录</p>

      <label class="block mb-4">
        <span class="text-xs text-ink-700">账号</span>
        <input
          v-model="account"
          class="mt-1.5 w-full rounded-md border border-line-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
          placeholder="客服账号"
        />
      </label>
      <label class="block mb-5">
        <span class="text-xs text-ink-700">密码</span>
        <input
          v-model="password"
          type="password"
          class="mt-1.5 w-full rounded-md border border-line-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-500"
          placeholder="登录密码"
          @keydown.enter="handleLogin"
        />
      </label>

      <div v-if="err" class="text-brand-600 text-xs mb-3">{{ err }}</div>

      <button
        class="w-full rounded-md bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-sm py-2.5 font-medium disabled:opacity-60"
        :disabled="loading"
        @click="handleLogin"
      >{{ loading ? '登录中…' : '登 录' }}</button>
    </div>
  </div>
</template>
