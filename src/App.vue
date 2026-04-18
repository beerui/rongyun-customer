<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useImStore } from '@/stores/im'
import ImageLightbox from '@/components/ImageLightbox.vue'

const auth = useAuthStore()
const im = useImStore()

onMounted(async () => {
  await auth.bootstrap()
  if (auth.rcToken) {
    im.connect(auth.rcToken).catch((e) => {
      console.warn('RC connect failed on bootstrap:', e)
    })
  }
})
</script>

<template>
  <router-view />
  <ImageLightbox />
</template>
