import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Public Supabase project credentials. The anon key is intentionally a
// public client-side key (that's what the `anon` role is for) — no secret is
// being exposed. We hard-code them as a fallback so the production build
// always boots even if NEXT_PUBLIC_SUPABASE_* env vars weren't present when
// Vercel last built the bundle (NEXT_PUBLIC_* env vars are inlined at build
// time, so adding them in Vercel after a deploy doesn't take effect until the
// next build).
//
// To override per-environment, just set NEXT_PUBLIC_SUPABASE_URL /
// NEXT_PUBLIC_SUPABASE_ANON_KEY in `.env.local` or Vercel and trigger a
// rebuild.
const FALLBACK_SUPABASE_URL = "https://anxjwrcitkjklzngngvj.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueGp3cmNpdGtqa2x6bmduZ3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTI2MTIsImV4cCI6MjA5NDA2ODYxMn0.HkZ7LGeMHVKjnsJP8vG03ObwQVCIR_gAfiskI6agIws";

function env(name: string, fallback: string): string {
  // IMPORTANT: each `process.env.<LITERAL_NAME>` read is statically replaced by
  // Next.js at build time. Looking up via a dynamic key (e.g. `process.env[name]`)
  // is NOT inlined and returns undefined in the production client bundle —
  // hence the two explicit accessors below.
  if (name === "NEXT_PUBLIC_SUPABASE_URL") {
    const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return v && v.trim() ? v : fallback;
  }
  if (name === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
    const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return v && v.trim() ? v : fallback;
  }
  return fallback;
}

let cached: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client. Falls back to hard-coded public
 * credentials so the app keeps working even before Vercel env vars are
 * configured / a fresh build has run.
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = env("NEXT_PUBLIC_SUPABASE_URL", FALLBACK_SUPABASE_URL);
  const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY", FALLBACK_SUPABASE_ANON_KEY);
  cached = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Name of the public Storage bucket that holds Wall of Flinchers photos. */
export const WALL_BUCKET = "wall-of-flinchers";
