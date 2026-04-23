<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-white">
    <header class="h-12 bg-white flex items-center px-3 border-b border-[#f0f0f0]">
      <button class="text-gray-500 text-lg" @click="router.back()">‹</button>
      <div class="flex-1 text-center text-sm font-medium text-gray-800">平台介绍</div>
      <div class="w-6" />
    </header>

    <main class="flex-1 min-h-0 overflow-y-auto px-5 py-10 flex flex-col items-center gap-5">
      <div class="flex flex-col items-center gap-5 w-full">
        <h1 class="text-[32px] font-semibold text-[#222]">关于我们</h1>
        <p class="text-2xl font-semibold text-[#FA3E3E] text-center">让交易有保障 让贸易更简单。</p>
        <p class="text-[20px] leading-[215%] text-[#555] text-left w-full">
          中国大集(ChinaMarket)平台由临沂市政府与深度集团联合出资成立，是助力中国最大批发市场集群向数字化、国际化转型的重要平台。平台以交易和服务为核心，聚焦解决供应商在外贸中面临的语言不通、关检汇税流程不熟悉、资金安全等难题，提供一站式全托管的国内外批发服务解决方案，让贸易更便捷!
          对于采购商，平台汇聚海量高竞争力、高品质商品，并提供门到门的履约服务与保障。作为国企平台，我们高度重视交易安全，以规范运营和全流程服务为支撑，成为您更值得信赖的贸易伙伴!
        </p>
      </div>
    </main>

    <nav class="h-12 border-t bg-white flex">
      <button class="flex-1 text-xs text-brand-500" @click="router.push('/m')">💬 咨询</button>
      <button class="flex-1 text-xs text-gray-700">🏠 介绍</button>
    </nav>
  </div>
</template>
