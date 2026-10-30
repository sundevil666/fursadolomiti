/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOY_TARGET?: 'ftp'
  readonly VITE_BOOKING_EMAIL_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
