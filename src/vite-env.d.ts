/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_YOUTUBE_API_KEY?: string;
  readonly VITE_YOUTUBE_REGION_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
