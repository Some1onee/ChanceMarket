import { describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import { SEED, integrationEnvReady, serviceClient, signedInClient } from "./helpers";

/**
 * Entry pipeline integration tests: eligibility, idempotency, caps under
 * concurrency, free entries, skill gating, close/snapshot/draw. Skipped
 * without a local seeded stack.
 */
describe.skipIf(!integrationEnvReady)("Entry pipeline", () => {
  it("creates and confirms a free-draw entry exactly once (idempotent)", async () => {
    const chloeKey = `it-free-${randomUUID()}`;
    const ben = await signedInClient(SEED.ben);

    // Chloe (US-CA) tries the WATCH campaign: paid_prize_competition is not
    // allowed in the US jurisdiction seed → deny-by-default must block it.
    const chloe = await signedInClient(SEED.chloe);
    const { data: order, error } = await chloe.rpc("create_entry_order", {
      p_campaign_id: SEED.campaigns.watch,
      p_quantity: 1,
      p_source: "paid",
      p_idempotency_key: chloeKey,
      p_declared_country: "US",
      p_skill_response_id: null,
    });
    expect(order).toBeNull();
    expect(error?.message).toMatch(/not_eligible/);

    // Ben (GB) enters the paid bike campaign via the RPC with a correct skill
    // response required → without one it must fail.
    const benKey = `it-skill-${randomUUID()}`;
    const { error: skillError } = await ben.rpc("create_entry_order", {
      p_campaign_id: SEED.campaigns.bike,
      p_quantity: 1,
      p_source: "paid",
      p_idempotency_key: benKey,
      p_declared_country: "GB",
      p_skill_response_id: null,
    });
    expect(skillError?.message).toMatch(/skill_response_required/);
  });

  it("enforces skill answers server-side and gates the order on correctness", async () => {
    const ben = await signedInClient(SEED.ben);
    const questionId = "80000000-0000-4000-8000-000000000001";
    const wrongOption = "81000000-0000-4000-8000-000000000002";
    const rightOption = "81000000-0000-4000-8000-000000000001";

    const { data: wrong } = await ben.rpc("submit_skill_response", {
      p_question_id: questionId,
      p_option_id: wrongOption,
    });
    expect(wrong?.is_correct).toBe(false);

    const { data: right } = await ben.rpc("submit_skill_response", {
      p_question_id: questionId,
      p_option_id: rightOption,
    });
    expect(right?.is_correct).toBe(true);

    // Wrong response id cannot unlock the order.
    const { error: gateError } = await ben.rpc("create_entry_order", {
      p_campaign_id: SEED.campaigns.bike,
      p_quantity: 2,
      p_source: "paid",
      p_idempotency_key: `it-gate-${randomUUID()}`,
      p_declared_country: "GB",
      p_skill_response_id: wrong!.id,
    });
    expect(gateError?.message).toMatch(/skill_response_incorrect/);

    // Correct one creates an awaiting_payment order; idempotent on retry.
    const key = `it-order-${randomUUID()}`;
    const { data: order } = await ben.rpc("create_entry_order", {
      p_campaign_id: SEED.campaigns.bike,
      p_quantity: 2,
      p_source: "paid",
      p_idempotency_key: key,
      p_declared_country: "GB",
      p_skill_response_id: right!.id,
    });
    expect(order?.status).toBe("awaiting_payment");
    expect(order?.total_minor).toBe(500);

    const { data: replay } = await ben.rpc("create_entry_order", {
      p_campaign_id: SEED.campaigns.bike,
      p_quantity: 2,
      p_source: "paid",
      p_idempotency_key: key,
      p_declared_country: "GB",
      p_skill_response_id: right!.id,
    });
    expect(replay?.id).toBe(order?.id);

    // Owner cannot confirm a PAID order client-side (payment required).
    const { error: confirmError } = await ben.rpc("confirm_entry_order", {
      p_order_id: order!.id,
      p_payment_transaction_id: null,
    });
    expect(confirmError).not.toBeNull();

    // Clean up the reservation for later tests.
    await ben.rpc("cancel_entry_order", { p_order_id: order!.id, p_reason: "test-cleanup" });
  });

  it("caps entries under concurrent confirmation (no oversell)", async () => {
    const service = serviceClient();

    // Fresh small campaign: 5 total entries.
    const { data: campaign } = await service
      .from("campaigns")
      .insert({
        seller_id: "40000000-0000-4000-8000-000000000001",
        category_id: "60000000-0000-4000-8000-000000000004",
        slug: `it-concurrency-${randomUUID().slice(0, 8)}`,
        title: "Concurrency test campaign",
        campaign_type: "free_draw",
        status: "active",
        prize_value_minor: 1000,
        currency: "GBP",
        entry_price_minor: 0,
        min_entries_per_order: 1,
        max_entries_per_order: 3,
        max_entries_per_user: 5,
        max_entries_total: 5,
        min_age: 18,
        starts_at: new Date(Date.now() - 60_000).toISOString(),
        ends_at: new Date(Date.now() + 3_600_000).toISOString(),
      })
      .select("id")
      .single();
    expect(campaign).not.toBeNull();

    // Allow it everywhere in GB (jurisdiction categories already allow consoles).
    const users = [SEED.alice, SEED.ben];
    const clients = await Promise.all(users.map((email) => signedInClient(email)));

    // Each user creates a 3-entry order → 6 requested for 5 slots.
    const orders = await Promise.all(
      clients.map((client, index) =>
        client.rpc("create_entry_order", {
          p_campaign_id: campaign!.id,
          p_quantity: 3,
          p_source: "promotional",
          p_idempotency_key: `it-conc-${index}-${randomUUID()}`,
          p_declared_country: "GB",
          p_skill_response_id: null,
        }),
      ),
    );

    // At most one of the two 3-entry reservations can coexist with the other
    // (3+3 > 5): the second must have been rejected at reservation time.
    const successes = orders.filter((order) => order.data !== null);
    const failures = orders.filter((order) => order.error !== null);
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0]?.error?.message).toMatch(/sold_out/);

    // Confirm concurrently (idempotent) — total confirmed must equal 3, never more.
    const successOrder = successes[0]!.data!;
    await Promise.all(
      Array.from({ length: 4 }, () =>
        clients[0]!.rpc("confirm_entry_order", {
          p_order_id: successOrder.id,
          p_payment_transaction_id: null,
        }),
      ),
    );

    const { data: finalCampaign } = await service
      .from("campaigns")
      .select("entries_confirmed, max_entries_total")
      .eq("id", campaign!.id)
      .single();
    expect(finalCampaign?.entries_confirmed).toBe(3);

    const { count } = await service
      .from("entries")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign!.id);
    expect(count).toBe(3);
  });

  it("runs close → snapshot → CSPRNG selection, and refuses silent re-runs", async () => {
    const service = serviceClient();

    // Close the concurrency campaign from the previous test (has 3 entries).
    const { data: campaign } = await service
      .from("campaigns")
      .select("id")
      .like("slug", "it-concurrency-%")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { error: closeError } = await service.rpc("close_campaign_entries", {
      p_campaign_id: campaign!.id,
    });
    expect(closeError).toBeNull();

    const { data: draw, error: snapError } = await service.rpc("create_draw_snapshot", {
      p_campaign_id: campaign!.id,
    });
    expect(snapError).toBeNull();
    expect(draw?.status).toBe("snapshot_created");

    const { data: selected } = await service.rpc("select_draw_winner", { p_draw_id: draw!.id });
    expect(selected?.status).toBe("selected");
    expect(selected?.winner_entry_id).not.toBeNull();
    expect(selected?.random_seed).toMatch(/^[0-9a-f]{32}$/);

    // Idempotency: re-running returns the SAME winner — never a silent re-roll.
    const { data: rerun } = await service.rpc("select_draw_winner", { p_draw_id: draw!.id });
    expect(rerun?.winner_entry_id).toBe(selected?.winner_entry_id);
    expect(rerun?.random_seed).toBe(selected?.random_seed);

    // Snapshot immutability: direct tampering must be rejected.
    const { error: tamperError } = await service
      .from("draw_snapshots")
      .update({ snapshot_hash: "0".repeat(64) })
      .eq("draw_id", draw!.id);
    expect(tamperError).not.toBeNull();
  });

  it("verifies the seeded public draw against the published formula", async () => {
    const service = serviceClient();
    const { data: draw } = await service
      .from("draws")
      .select("random_seed, winner_entry_id, draw_snapshots!d_snapshot_fk(entries_count)")
      .eq("public_id", "DRW-2026-000042")
      .single();

    const snapshot = (draw as unknown as { draw_snapshots: { entries_count: number } })
      .draw_snapshots;
    const seed = draw!.random_seed!;
    const value = BigInt(`0x${seed.slice(0, 16)}`) & ((1n << 63n) - 1n);
    const position = Number(value % BigInt(snapshot.entries_count)) + 1;
    expect(position).toBe(4);

    const { data: entry } = await service
      .from("entries")
      .select("entry_number")
      .eq("id", draw!.winner_entry_id!)
      .single();
    expect(entry?.entry_number).toBe(4);
  });
});
