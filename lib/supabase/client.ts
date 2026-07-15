"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Browser Supabase client (anon key only — RLS enforced). Singleton. */
export function getSupabaseBrowserClient() {
  if (!client) {
    const { url, publishableKey } = getSupabasePublicEnv();
    client = createBrowserClient<Database>(url, publishableKey);
  }
  return client;
}
