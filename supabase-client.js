// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────
// Single shared Supabase client for the entire app.
//
// SECURITY NOTE: The publishable key below is safe to embed in the client
// bundle — it's the public anon/publishable key designed for browser use.
// What actually protects data is Row Level Security (RLS) policies on each
// table. Never put the SERVICE ROLE key here; that one is server-only.
//
// The project URL is also not a secret.

import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://babbgaziiyjfaqjsaxgd.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rGrh2oIi8fuBv_9w9ZSneg_H6HdBmk-";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,        // Keep users logged in across reloads (localStorage)
    autoRefreshToken: true,      // Refresh JWT before it expires
    detectSessionInUrl: true,    // Parse OAuth redirect hash fragments automatically
    flowType: "implicit",        // Standard SPA flow (vs. PKCE which needs a server)
  },
});
