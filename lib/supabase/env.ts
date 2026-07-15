/** Validated public Supabase environment. Fails fast with a clear message. */
export function getSupabasePublicEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — copy .env.example to .env.local and fill in your Supabase project values.",
    );
  }
  return { url, publishableKey };
}
