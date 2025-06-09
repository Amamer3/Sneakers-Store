/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL_APP_PAYSTACK_PUBLIC_KEY: string
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
