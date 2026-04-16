<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useImStore } from '@/stores/im'

const auth = useAuthStore()
const im = useImStore()

onMounted(async () => {
  await auth.bootstrap()
  if (auth.rcToken) await im.connect(auth.rcToken)
})
</script>

<template>
  <router-view />
</template>
