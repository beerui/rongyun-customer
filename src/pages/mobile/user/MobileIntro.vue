<script setup lang="ts">
import { useRouter } from 'vue-router'
import PlatformIntro from '@/pages/pc/user/PlatformIntro.vue'

const router = useRouter()
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-white">
    <header class="h-12 bg-white flex items-center px-3 border-b">
      <button class="text-gray-500 text-lg" @click="router.back()">‹</button>
      <div class="flex-1 text-center text-sm font-medium text-gray-800">平台介绍</div>
      <div class="w-6" />
    </header>
    <main class="flex-1 min-h-0 overflow-y-auto">
      <PlatformIntro />
    </main>
    <nav class="h-12 border-t bg-white flex">
      <button class="flex-1 text-xs text-brand-500" @click="router.push('/m')">💬 咨询</button>
      <button class="flex-1 text-xs text-gray-700">🏠 介绍</button>
    </nav>
  </div>
</template>
