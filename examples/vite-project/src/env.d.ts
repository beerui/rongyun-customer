/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CS_BASE_URL: string
  readonly VITE_CS_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
