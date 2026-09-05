import { createClient, type Session } from "@supabase/supabase-js";

// These are PUBLIC by design (publishable key + project URL) and safe to embed
// in the client bundle — data is protected by row-level security, not by
// hiding the key. Overridable at build time via VITE_ env vars.
const url =
  import.meta.env.VITE_SUPABASE_URL ?? "https://pzqdeqexisohgeuzqyal.supabase.co";
const key =
  import.meta.env.VITE_SUPABASE_KEY ??
  "sb_publishable_ySKE5_0dmyk8Tm8xIT2IJg_L6tnPzKm";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // completes the magic-link redirect
  },
});

/** Deployed app URL (origin + Vite base) — used as the magic-link redirect. */
export function appUrl(): string {
  return window.location.origin + import.meta.env.BASE_URL;
}

export type { Session };
