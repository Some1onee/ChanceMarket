import { describe, expect, it } from "vitest";
import { SEED, anonClient, integrationEnvReady, serviceClient, signedInClient } from "./helpers";

/**
 * RLS policy tests with multiple identities, including cross-user access
 * attempts. Skipped without a local seeded stack (see helpers.ts).
 */
describe.skipIf(!integrationEnvReady)("Row Level Security", () => {
  it("anon can read published campaigns but not drafts", async () => {
    const anon = anonClient();
    const { data: published } = await anon
      .from("campaigns")
      .select("id, status")
      .eq("id", SEED.campaigns.bike);
    expect(published).toHaveLength(1);

    const { data: drafts } = await anon.from("campaigns").select("id").eq("status", "draft");
    expect(drafts).toHaveLength(0);
  });

  it("anon cannot read profiles, orders, private details or ledger", async () => {
    const anon = anonClient();
    const [profiles, orders, details, ledger] = await Promise.all([
      anon.from("profiles").select("id"),
      anon.from("entry_orders").select("id"),
      anon.from("user_private_details").select("user_id"),
      anon.from("financial_ledger").select("id"),
    ]);
    expect(profiles.data ?? []).toHaveLength(0);
    expect(orders.data ?? []).toHaveLength(0);
    expect(details.data ?? []).toHaveLength(0);
    expect(ledger.data ?? []).toHaveLength(0);
  });

  it("a user sees their own orders but not another user's", async () => {
    const alice = await signedInClient(SEED.alice);
    const { data: own } = await alice.from("entry_orders").select("id, user_id");
    expect((own ?? []).length).toBeGreaterThan(0);
    expect((own ?? []).every((order) => order.user_id === (own ?? [])[0]?.user_id)).toBe(true);

    // Ben's orders must be invisible to Alice.
    const ben = await signedInClient(SEED.ben);
    const {
      data: { user: benUser },
    } = await ben.auth.getUser();
    const { data: crossRead } = await alice
      .from("entry_orders")
      .select("id")
      .eq("user_id", benUser!.id);
    expect(crossRead ?? []).toHaveLength(0);
  });

  it("a user cannot update another user's profile (IDOR)", async () => {
    const alice = await signedInClient(SEED.alice);
    const ben = await signedInClient(SEED.ben);
    const {
      data: { user: benUser },
    } = await ben.auth.getUser();

    const { data: updated } = await alice
      .from("profiles")
      .update({ display_name: "hacked" })
      .eq("id", benUser!.id)
      .select("id");
    expect(updated ?? []).toHaveLength(0);

    const { data: benProfile } = await ben.from("profiles").select("display_name").single();
    expect(benProfile?.display_name).not.toBe("hacked");
  });

  it("users cannot write to user_roles (privilege escalation)", async () => {
    const alice = await signedInClient(SEED.alice);
    const {
      data: { user },
    } = await alice.auth.getUser();
    const { error } = await alice.from("user_roles").insert({ user_id: user!.id, role: "admin" });
    expect(error).not.toBeNull();
  });

  it("skill question answers are unreadable by every client role", async () => {
    const anon = anonClient();
    const alice = await signedInClient(SEED.alice);
    const [anonRead, userRead] = await Promise.all([
      anon.from("skill_question_answers").select("question_id"),
      alice.from("skill_question_answers").select("question_id"),
    ]);
    expect(anonRead.data ?? []).toHaveLength(0);
    expect(userRead.data ?? []).toHaveLength(0);

    // ...while the service key can (it manages them).
    const service = serviceClient();
    const { data: serviceRead } = await service
      .from("skill_question_answers")
      .select("question_id");
    expect((serviceRead ?? []).length).toBeGreaterThan(0);
  });

  it("users cannot flip campaign status directly (state machine bypass)", async () => {
    const seller = await signedInClient(SEED.sellerOne);
    const { data: updated } = await seller
      .from("campaigns")
      .update({ status: "active" })
      .eq("id", "70000000-0000-4000-8000-000000000006") // seller.one's own draft
      .select("id");
    // Update policy WITH CHECK forbids changing status out of draft states.
    expect(updated ?? []).toHaveLength(0);
  });

  it("draw records are publicly readable, draw entry mapping is not", async () => {
    const anon = anonClient();
    const { data: draws } = await anon.from("draws").select("public_id");
    expect((draws ?? []).length).toBeGreaterThan(0);

    const { data: mapping } = await anon.from("draw_entries").select("id");
    expect(mapping ?? []).toHaveLength(0);
  });

  it("audit logs are admin-only", async () => {
    const alice = await signedInClient(SEED.alice);
    const { data: asUser } = await alice.from("audit_logs").select("id");
    expect(asUser ?? []).toHaveLength(0);

    const admin = await signedInClient(SEED.admin);
    const { data: asAdmin } = await admin.from("audit_logs").select("id").limit(5);
    expect((asAdmin ?? []).length).toBeGreaterThan(0);
  });
});
