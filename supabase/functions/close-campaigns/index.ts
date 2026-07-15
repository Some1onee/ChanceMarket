// Supabase Edge Function: scheduled campaign close + draw pipeline.
// Deploy:  supabase functions deploy close-campaigns
// Schedule (SQL):  select cron.schedule('close-campaigns', '*/10 * * * *',
//   $$select net.http_post('https://<ref>.functions.supabase.co/close-campaigns',
//     headers => jsonb_build_object('Authorization', 'Bearer ' || '<CRON_SECRET>'))$$);
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (request) => {
  const secret = Deno.env.get("CRON_SECRET");
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const closed: string[] = [];
  const errors: string[] = [];

  const { data: due } = await supabase
    .from("campaigns")
    .select("id, slug")
    .in("status", ["active", "sold_out", "paused", "closing"])
    .not("ends_at", "is", null)
    .lte("ends_at", new Date().toISOString())
    .limit(20);

  for (const campaign of due ?? []) {
    try {
      const { error: closeError } = await supabase.rpc("close_campaign_entries", {
        p_campaign_id: campaign.id,
      });
      if (closeError) throw new Error(closeError.message);

      const { data: draw, error: snapError } = await supabase.rpc("create_draw_snapshot", {
        p_campaign_id: campaign.id,
      });
      if (snapError) throw new Error(snapError.message);

      const { error: selectError } = await supabase.rpc("select_draw_winner", {
        p_draw_id: draw.id,
      });
      if (selectError) throw new Error(selectError.message);

      closed.push(campaign.slug);
    } catch (error) {
      errors.push(`${campaign.slug}: ${error instanceof Error ? error.message : "unknown"}`);
    }
  }

  await supabase.rpc("release_expired_reservations");

  return new Response(JSON.stringify({ closed, errors }), {
    headers: { "content-type": "application/json" },
  });
});
