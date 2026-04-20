import { defineConfig } from 'vite'

// 显式传空 postcss 对象，阻止 Vite 向上查找到仓库根的 postcss/tailwind 配置，
// 避免 example 构建时输出无关的 tailwind content 警告。
export default defineConfig({
  server: { port: 5174, open: true },
  build: { outDir: 'dist' },
  css: { postcss: { plugins: [] } },
})
