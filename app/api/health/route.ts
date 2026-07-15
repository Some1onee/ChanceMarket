import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** Health check: app + database reachability. No sensitive detail leaks. */
export async function GET() {
  const checks: Record<string, "ok" | "fail"> = { app: "ok", database: "fail" };
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("categories").select("id", { head: true, count: "exact" });
    checks.database = error ? "fail" : "ok";
  } catch {
    checks.database = "fail";
  }
  const healthy = Object.values(checks).every((status) => status === "ok");
  return NextResponse.json(
    { status: healthy ? "healthy" : "degraded", checks, ts: new Date().toISOString() },
    { status: healthy ? 200 : 503 },
  );
}
