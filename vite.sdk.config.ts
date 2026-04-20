import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import path from 'node:path'

/**
 * SDK 的 ESM + CJS + .d.ts 构建。
 *
 * 产物（dist/sdk 下）：
 *   - esm/index.js        —— 现代 bundler / import map
 *   - cjs/index.cjs       —— Node.js require / 旧 bundler
 *   - types/index.d.ts    —— TypeScript 类型定义（rollupTypes 合并成单文件）
 *
 * IIFE 产物由 vite.sdk.iife.config.ts 单独产出，避免 lib 多入口/多 format 冲突。
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  publicDir: false,
  plugins: [
    dts({
      entryRoot: 'src/sdk',
      outDir: 'dist/sdk/types',
      include: ['src/sdk/**/*'],
      insertTypesEntry: true,
      rollupTypes: true,
      staticImport: true,
      // 只打 index.ts 对外暴露的类型；iife-entry 不发 d.ts（它只是 bundle 入口）
      exclude: ['src/sdk/iife-entry.ts'],
    }),
  ],
  build: {
    outDir: 'dist/sdk',
    emptyOutDir: true,
    // 关闭 public/ 自动拷贝：SDK 构建产物不应包含 demo/bundle 这些与宿主应用共用的资源
    lib: {
      entry: path.resolve(__dirname, 'src/sdk/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.esm.js' : 'index.cjs'),
    },
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      // 保守：禁止内联非本包模块（虽然当前 SDK 无第三方依赖，但预留扩展）
      external: [],
    },
  },
})
