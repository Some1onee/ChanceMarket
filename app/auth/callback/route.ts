import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** OAuth / PKCE code exchange (Google sign-in, magic links). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirectTo.pathname = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = "/sign-in";
  redirectTo.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(redirectTo);
}
