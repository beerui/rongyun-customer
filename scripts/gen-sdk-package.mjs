#!/usr/bin/env node
/**
 * 把 package.sdk.json 作为 SDK 包的 manifest 写到 dist/sdk/package.json。
 *
 * 这样 dist/sdk 本身就是一个可发布的 npm 包（pnpm pack dist/sdk）。
 * 也可以同步注入根 package.json 的 version。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const srcManifest = path.resolve(root, 'package.sdk.json')
const outDir = path.resolve(root, 'dist/sdk')
const outManifest = path.resolve(outDir, 'package.json')
const readmeSrc = path.resolve(root, 'src/sdk/README.md')
const readmeOut = path.resolve(outDir, 'README.md')

if (!fs.existsSync(srcManifest)) {
  console.error(`[build-sdk-meta] package.sdk.json not found at ${srcManifest}`)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })
const pkg = JSON.parse(fs.readFileSync(srcManifest, 'utf8'))
fs.writeFileSync(outManifest, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
console.log(`[build-sdk-meta] wrote ${path.relative(root, outManifest)} (${pkg.name}@${pkg.version})`)

// vite-plugin-dts 的 rollupTypes 跟随 fileName 命名，会产出 types/index.esm.d.ts；
// 为保持 package.json "types" 指向的 ./types/index.d.ts 正确，做一次重命名。
const dtsIn = path.resolve(outDir, 'types/index.esm.d.ts')
const dtsOut = path.resolve(outDir, 'types/index.d.ts')
if (fs.existsSync(dtsIn)) {
  fs.renameSync(dtsIn, dtsOut)
  console.log(`[build-sdk-meta] renamed types/index.esm.d.ts → types/index.d.ts`)
}

if (fs.existsSync(readmeSrc)) {
  fs.copyFileSync(readmeSrc, readmeOut)
  console.log(`[build-sdk-meta] copied README to ${path.relative(root, readmeOut)}`)
}
