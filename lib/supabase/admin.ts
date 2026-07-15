import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Service-role client. BYPASSES RLS. Server-only ("server-only" import makes
 * bundling into client code a build error). Use exclusively inside audited
 * service functions: webhooks, draws, admin operations, outbox processing.
 */
export function getSupabaseAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Admin/server flows require the service-role key (server environment only — never expose it to the browser).",
    );
  }
  const { url } = getSupabasePublicEnv();
  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
