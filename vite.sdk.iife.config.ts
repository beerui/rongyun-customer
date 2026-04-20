import { defineConfig } from 'vite'
import path from 'node:path'

/**
 * SDK 的 IIFE 构建（独立一次）。
 *
 * 产物：dist/sdk/iife/daji-cs.iife.js —— `<script>` 直接加载挂到 window.DajiCS
 * 入口：src/sdk/iife-entry.ts（负责组装 api 并挂 window）
 *
 * 注意：emptyOutDir 必须为 false，避免清掉 ESM/CJS 输出（它们先于本次构建产出）。
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  publicDir: false,
  build: {
    outDir: 'dist/sdk/iife',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/sdk/iife-entry.ts'),
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
