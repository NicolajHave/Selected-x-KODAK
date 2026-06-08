/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Shared password gating the HQ / Admin views. Set in Vercel / .env.local. */
  readonly VITE_ADMIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.asset.json" {
  const asset: {
    version: number;
    asset_id: string;
    project_id: string;
    url: string;
    r2_key: string;
    original_filename: string;
    size: number;
    content_type: string;
    created_at: string;
  };
  export default asset;
}
