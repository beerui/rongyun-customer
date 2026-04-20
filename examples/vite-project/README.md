# DajiCS Vite + TypeScript 示例

一个完整的 Vite 子项目，演示在现代 TS 项目中通过 npm 依赖接入 SDK 的姿势。

## 运行步骤

```bash
# 1. 在仓库根目录先构建 SDK（示例以 file: 协议引用 dist/sdk）
cd ../../
pnpm install && pnpm build:sdk

# 2. 回到示例目录安装 + 跑起
cd examples/vite-project
pnpm install
pnpm dev
```

打开 http://localhost:5210 即可看到：

- 模拟商品列表页，点击任一商品"咨询客服"触发 `DajiCS.open` + 预投商品卡 + 开新窗
- 右上角 HUD 实时打印所有 SDK 事件（带时间戳）
- 底部工具栏：挂载/卸载 Launcher、toggle widget、模拟未读变化、刷新身份、模拟会话结束

## 环境变量

SDK 的 `baseUrl` / `apiBase` 通过 `.env.[mode]` 注入，按 Vite 惯例区分环境：

| 文件 | 用途 | 触发命令 |
|---|---|---|
| `.env.development` | 本地 dev（默认） | `pnpm dev` |
| `.env.staging` | 预发 | `pnpm build:staging` |
| `.env.production` | 生产 | `pnpm build` |
| `.env.example` | 模板 | — |

变量：

```bash
VITE_CS_BASE_URL=<客服站点根，SDK 会据此拼 iframe src + origin 白名单>
VITE_CS_API_BASE=<后端 API 根，SDK 调 sendRyMessage 等接口使用>
```

## 验证点

1. **TS 类型补全**：在 `src/main.ts` 里 `on(` 会提示所有事件名；`boot(` 提示 `DajiCSBootOptions` 的完整字段
2. **tree-shaking**：生产构建 `pnpm build` 产物里未使用的导出（如 `sendToOpenWindow`）会被 rollup 剔除
3. **source map**：开发模式下 DevTools 能直接看到 SDK 的 TS 源码行
