/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Set in Vercel / .env.local. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable key. Safe to ship: RLS limits it to INSERT-only. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
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
