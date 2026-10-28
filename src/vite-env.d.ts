/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL, e.g. https://casiguro-api.ondigitalocean.app (falls back to http://localhost:5000) */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
