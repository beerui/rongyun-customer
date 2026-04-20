import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: { port: 5200, host: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'rc-vendor': ['@rongcloud/imlib-next', '@rongcloud/engine'],
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
})
