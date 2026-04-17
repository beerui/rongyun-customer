import { defineConfig } from 'vite'
import path from 'node:path'

// 独立构建 SDK 产物：IIFE，全局名 DajiCS，单文件无外部依赖
// 命令：vite build --config vite.sdk.config.ts
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    outDir: 'dist/sdk',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/sdk/index.ts'),
      name: 'DajiCS',
      formats: ['iife'],
      fileName: () => 'daji-cs.iife.js',
    },
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: { extend: true },
    },
  },
})
