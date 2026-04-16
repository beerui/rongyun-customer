declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const c: DefineComponent<{}, {}, any>
  export default c
}

interface ImportMetaEnv {
  readonly VITE_RC_APPKEY: string
  readonly VITE_API_BASE: string
  readonly VITE_OSS_BASE: string
  readonly VITE_READY_TOKEN: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
