<script setup lang="ts">
import { computed } from 'vue'
import Avatar from '@/components/Avatar.vue'
import { useImStore } from '@/stores/im'

const props = defineProps<{
  peer?: { id: string; name: string; avatar?: string }
}>()

const im = useImStore()
const msgCount = computed(() => im.messages.length)
</script>

<template>
  <div class="h-full bg-white border-l flex flex-col">
    <div class="px-4 py-3 border-b text-sm font-medium text-gray-800">用户信息</div>
    <div v-if="!peer" class="flex-1 flex items-center justify-center text-gray-400 text-sm">
      未选择会话
    </div>
    <div v-else class="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
      <div class="flex flex-col items-center">
        <Avatar :src="peer.avatar" :name="peer.name" :size="64" />
        <div class="mt-3 text-sm font-medium text-gray-800">{{ peer.name }}</div>
        <div class="text-xs text-gray-400 mt-1">ID: {{ peer.id }}</div>
      </div>

      <div class="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
        <div class="flex justify-between"><span>本次消息数</span><span>{{ msgCount }}</span></div>
        <div class="flex justify-between"><span>来源</span><span>Web</span></div>
        <div class="flex justify-between"><span>状态</span><span class="text-green-600">在线</span></div>
      </div>

      <div>
        <div class="text-xs text-gray-500 mb-2">快捷回复</div>
        <div class="flex flex-wrap gap-2">
          <button class="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1">您好，有什么可以帮您？</button>
          <button class="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1">稍等，我查一下</button>
          <button class="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1">感谢咨询！</button>
        </div>
      </div>
    </div>
  </div>
</template>
