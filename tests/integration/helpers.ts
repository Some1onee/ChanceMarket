import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Integration test helpers. Require a LOCAL seeded stack:
 *   pnpm db:start && pnpm db:reset
 * then set SUPABASE_TEST_URL / SUPABASE_TEST_ANON_KEY / SUPABASE_TEST_SECRET_KEY.
 * All tests are skipped when the env is absent.
 */

export const TEST_URL = process.env.SUPABASE_TEST_URL ?? "";
export const TEST_ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY ?? "";
export const TEST_SECRET_KEY = process.env.SUPABASE_TEST_SECRET_KEY ?? "";

export const integrationEnvReady = Boolean(TEST_URL && TEST_ANON_KEY && TEST_SECRET_KEY);

export const DEMO_PASSWORD = "Demo1234!pass";

export const SEED = {
  alice: "alice@demo.test",
  ben: "ben@demo.test",
  chloe: "chloe@demo.test",
  admin: "admin@demo.test",
  sellerOne: "seller.one@demo.test",
  campaigns: {
    bike: "70000000-0000-4000-8000-000000000001",
    watch: "70000000-0000-4000-8000-000000000002",
    console: "70000000-0000-4000-8000-000000000003",
    completedChair: "70000000-0000-4000-8000-000000000007",
  },
} as const;

export function anonClient(): SupabaseClient<Database> {
  return createClient<Database>(TEST_URL, TEST_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function serviceClient(): SupabaseClient<Database> {
  return createClient<Database>(TEST_URL, TEST_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function signedInClient(email: string): Promise<SupabaseClient<Database>> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
  if (error) throw new Error(`Could not sign in ${email}: ${error.message}`);
  return client;
}
