/**
 * Hand-authored database types matching supabase/migrations.
 * Regenerate with `pnpm db:types` once a local stack is running; until then
 * this file is the typed contract used across the app.
 *
 * NOTE: Insert/Update are pragmatic Partial<Row> shapes — real write-path
 * validation happens in Zod schemas and SQL constraints/functions.
 */

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type UserRole =
  | "user"
  | "seller"
  | "moderator"
  | "compliance"
  | "support"
  | "finance"
  | "admin"
  | "super_admin";

export type CampaignStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "active"
  | "paused"
  | "sold_out"
  | "closing"
  | "drawing"
  | "winner_pending"
  | "winner_confirmed"
  | "fulfilment"
  | "completed"
  | "cancelled"
  | "rejected"
  | "disputed";

export type CampaignType =
  | "paid_prize_competition"
  | "free_draw"
  | "sweepstakes"
  | "hybrid_paid_with_free_route"
  | "skill_based_competition";

export type PaymentStatus =
  | "created"
  | "requires_action"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "partially_refunded"
  | "refunded"
  | "disputed";

export type PayoutStatus =
  | "pending"
  | "held"
  | "approved"
  | "processing"
  | "paid"
  | "failed"
  | "reversed";

export type VerificationStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "failed"
  | "manual_review"
  | "expired";

export type EntryStatus = "pending" | "confirmed" | "cancelled" | "excluded";

export type EntrySource = "paid" | "free_route" | "promotional";

export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "processing"
  | "confirmed"
  | "cancelled"
  | "failed"
  | "refunded";

export type DrawStatus =
  | "pending"
  | "snapshot_created"
  | "selected"
  | "winner_verified"
  | "void"
  | "reroll_requested"
  | "rerolled";

export type FulfilmentStatus =
  | "provisional_winner"
  | "verifying"
  | "accepted"
  | "collecting_details"
  | "shipping"
  | "delivered"
  | "ownership_transferred"
  | "received_confirmed"
  | "declined"
  | "expired"
  | "disputed"
  | "replaced";

export type SellerStatus = "pending" | "approved" | "suspended" | "rejected";

export type ModerationDecision =
  | "pending"
  | "approved"
  | "changes_requested"
  | "rejected"
  | "escalated";

export type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  country_code: string | null;
  subdivision_code: string | null;
  city: string | null;
  locale: string;
  currency: string;
  identity_status: VerificationStatus;
  age_status: VerificationStatus;
  account_status: "active" | "restricted" | "paused" | "self_excluded" | "closed";
  marketing_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: UserRole;
  granted_by: string | null;
  created_at: string;
}

export type UserPrivateDetailsRow = {
  user_id: string;
  legal_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type UserConsentRow = {
  id: string;
  user_id: string;
  consent_key: string;
  granted: boolean;
  version: string;
  created_at: string;
}

export type UserProtectionSettingsRow = {
  user_id: string;
  spend_limit_minor: number | null;
  spend_limit_currency: string;
  spend_limit_period: "daily" | "weekly" | "monthly";
  paused_until: string | null;
  self_excluded_at: string | null;
  self_exclusion_ends_at: string | null;
  marketing_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  requires_extra_review: boolean;
  created_at: string;
}

export type CampaignRow = {
  id: string;
  seller_id: string;
  category_id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  campaign_type: CampaignType;
  status: CampaignStatus;
  prize_value_minor: number;
  currency: string;
  entry_price_minor: number;
  min_entries_per_order: number;
  max_entries_per_order: number;
  max_entries_per_user: number;
  max_entries_total: number;
  entries_confirmed: number;
  free_route_enabled: boolean;
  free_route_instructions: string | null;
  skill_question_required: boolean;
  min_age: number;
  starts_at: string | null;
  ends_at: string | null;
  location_country: string | null;
  location_region: string | null;
  delivery_policy: string | null;
  cover_image_path: string | null;
  attributes: Record<string, string> | null;
  published_at: string | null;
  closed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type CampaignImageRow = {
  id: string;
  campaign_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
}

export type CampaignDocumentRow = {
  id: string;
  campaign_id: string;
  storage_path: string;
  document_type: "proof_of_ownership" | "valuation" | "insurance" | "other";
  status: "pending" | "accepted" | "rejected";
  notes: string | null;
  created_at: string;
}

export type CampaignRulesVersionRow = {
  id: string;
  campaign_id: string;
  version: number;
  language: string;
  content_md: string;
  is_current: boolean;
  created_at: string;
}

export type CampaignEligibilityRegionRow = {
  id: string;
  campaign_id: string;
  country_code: string;
  subdivision_code: string | null;
  mode: "allow" | "deny";
  created_at: string;
}

export type CampaignQuestionRow = {
  id: string;
  campaign_id: string;
  user_id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  is_public: boolean;
  created_at: string;
}

export type FavoriteRow = {
  id: string;
  user_id: string;
  campaign_id: string;
  created_at: string;
}

export type JurisdictionRow = {
  id: string;
  country_code: string;
  subdivision_code: string | null;
  name: string;
  is_active: boolean;
  requires_legal_approval: boolean;
  legal_approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type JurisdictionRuleRow = {
  id: string;
  jurisdiction_id: string;
  rule_key: string;
  rule_value: Record<string, unknown>;
  version: number;
  effective_from: string;
  effective_until: string | null;
  requires_legal_approval: boolean;
  approved_by: string | null;
  created_by: string | null;
  created_at: string;
}

export type JurisdictionCampaignTypeRow = {
  id: string;
  jurisdiction_id: string;
  campaign_type: CampaignType;
  is_allowed: boolean;
  free_route_mandatory: boolean;
  skill_required: boolean;
  min_age: number;
  kyc_required_above_minor: number | null;
  max_entry_price_minor: number | null;
  max_prize_value_minor: number | null;
  requires_legal_approval: boolean;
  effective_from: string;
  effective_until: string | null;
  created_at: string;
}

export type JurisdictionCategoryRow = {
  id: string;
  jurisdiction_id: string;
  category_id: string;
  is_allowed: boolean;
  requires_extra_review: boolean;
  created_at: string;
}

export type ComplianceDecisionRow = {
  id: string;
  subject_type: "campaign_publish" | "entry" | "seller_onboarding" | "visibility";
  subject_id: string;
  user_id: string | null;
  campaign_id: string | null;
  jurisdiction_id: string | null;
  decision: "allow" | "deny" | "review";
  reasons: string[];
  rule_snapshot: Record<string, unknown> | null;
  created_at: string;
}

export type GeoCheckRow = {
  id: string;
  user_id: string | null;
  country_code: string | null;
  subdivision_code: string | null;
  ip_hash: string | null;
  method: "ip_headers" | "provider" | "declared";
  is_consistent: boolean | null;
  flagged_reason: string | null;
  created_at: string;
}

export type FeatureFlagRow = {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export type SellerProfileRow = {
  id: string;
  user_id: string;
  business_name: string | null;
  entity_type: "individual" | "company";
  country_code: string;
  status: SellerStatus;
  kyb_status: VerificationStatus;
  payout_details_set: boolean;
  terms_accepted_at: string | null;
  max_active_campaigns: number;
  allowed_category_ids: string[] | null;
  public_name: string;
  public_bio: string | null;
  created_at: string;
  updated_at: string;
}

export type IdentityVerificationRow = {
  id: string;
  user_id: string;
  provider: string;
  provider_ref: string | null;
  kind: "identity" | "age" | "kyb" | "residence";
  status: VerificationStatus;
  result_summary: Record<string, unknown> | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type EntryOrderRow = {
  id: string;
  user_id: string;
  campaign_id: string;
  quantity: number;
  unit_price_minor: number;
  total_minor: number;
  currency: string;
  status: OrderStatus;
  source: EntrySource;
  idempotency_key: string;
  payment_transaction_id: string | null;
  declared_country: string | null;
  geo_check_id: string | null;
  skill_response_id: string | null;
  created_at: string;
  updated_at: string;
}

export type EntryRow = {
  id: string;
  campaign_id: string;
  user_id: string;
  order_id: string | null;
  entry_number: number;
  source: EntrySource;
  status: EntryStatus;
  created_at: string;
}

export type FreeEntryRequestRow = {
  id: string;
  campaign_id: string;
  user_id: string;
  method: "online_form" | "postal";
  status: "received" | "accepted" | "rejected" | "duplicate";
  details: Record<string, unknown> | null;
  processed_by: string | null;
  processed_at: string | null;
  order_id: string | null;
  created_at: string;
}

export type SkillQuestionRow = {
  id: string;
  campaign_id: string;
  version: number;
  question: string;
  is_current: boolean;
  created_at: string;
}

export type SkillQuestionOptionRow = {
  id: string;
  question_id: string;
  label: string;
  sort_order: number;
}

export type SkillResponseRow = {
  id: string;
  question_id: string;
  user_id: string;
  option_id: string;
  is_correct: boolean;
  created_at: string;
}

export type PaymentCustomerRow = {
  id: string;
  user_id: string;
  provider: string;
  provider_customer_id: string;
  created_at: string;
}

export type PaymentTransactionRow = {
  id: string;
  user_id: string;
  order_id: string | null;
  provider: string;
  provider_intent_id: string | null;
  amount_minor: number;
  currency: string;
  status: PaymentStatus;
  failure_reason: string | null;
  idempotency_key: string;
  refunded_minor: number;
  created_at: string;
  updated_at: string;
}

export type RefundRow = {
  id: string;
  payment_transaction_id: string;
  amount_minor: number;
  currency: string;
  reason: string;
  status: "pending" | "succeeded" | "failed";
  provider_refund_id: string | null;
  requested_by: string | null;
  created_at: string;
  updated_at: string;
}

export type FinancialLedgerRow = {
  id: string;
  entry_type:
    | "entry_payment"
    | "platform_fee"
    | "provider_fee"
    | "refund"
    | "chargeback"
    | "reserve_hold"
    | "reserve_release"
    | "seller_payout"
    | "payout_reversal"
    | "adjustment";
  account: "platform" | "seller" | "user" | "provider" | "reserve";
  account_ref: string | null;
  campaign_id: string | null;
  payment_transaction_id: string | null;
  payout_id: string | null;
  amount_minor: number;
  currency: string;
  memo: string | null;
  idempotency_key: string | null;
  created_at: string;
}

export type SellerBalanceRow = {
  seller_id: string;
  currency: string;
  available_minor: number;
  reserved_minor: number;
  pending_minor: number;
  updated_at: string;
}

export type PayoutRow = {
  id: string;
  seller_id: string;
  campaign_id: string | null;
  amount_minor: number;
  currency: string;
  status: PayoutStatus;
  provider_payout_id: string | null;
  approved_by: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type PlatformFeeRow = {
  id: string;
  campaign_id: string;
  basis_points: number;
  fixed_minor: number;
  currency: string;
  created_at: string;
}

export type DrawRow = {
  id: string;
  campaign_id: string;
  public_id: string;
  status: DrawStatus;
  snapshot_id: string | null;
  winner_entry_id: string | null;
  selection_method: "csprng" | "external_seed";
  random_seed: string | null;
  random_seed_hash: string | null;
  selected_at: string | null;
  executed_by: string | null;
  reroll_of: string | null;
  reroll_reason: string | null;
  reroll_approved_by: string | null;
  reroll_second_approver: string | null;
  created_at: string;
  updated_at: string;
}

export type DrawSnapshotRow = {
  id: string;
  draw_id: string;
  campaign_id: string;
  entries_count: number;
  snapshot_hash: string;
  rules_version_id: string | null;
  created_at: string;
}

export type DrawEntryRow = {
  id: string;
  snapshot_id: string;
  entry_id: string;
  position: number;
}

export type WinnerVerificationRow = {
  id: string;
  draw_id: string;
  entry_id: string;
  user_id: string;
  status: VerificationStatus;
  notes: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PrizeFulfilmentRow = {
  id: string;
  draw_id: string;
  campaign_id: string;
  winner_user_id: string;
  status: FulfilmentStatus;
  delivery_details: Record<string, unknown> | null;
  proof_storage_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationRow = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

export type NotificationPreferenceRow = {
  user_id: string;
  email_marketing: boolean;
  email_transactional: boolean;
  inapp_campaign_updates: boolean;
  inapp_draw_results: boolean;
  updated_at: string;
}

export type ReportRow = {
  id: string;
  reporter_id: string | null;
  subject_type: "campaign" | "user" | "seller" | "question";
  subject_id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewing" | "actioned" | "dismissed";
  handled_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DisputeRow = {
  id: string;
  user_id: string;
  campaign_id: string | null;
  order_id: string | null;
  kind: "refund" | "prize" | "conduct" | "payment" | "other";
  status: "open" | "investigating" | "resolved" | "rejected" | "escalated";
  summary: string;
  resolution: string | null;
  handled_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SupportThreadRow = {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "pending_user" | "pending_support" | "closed";
  created_at: string;
  updated_at: string;
}

export type SupportMessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  is_staff: boolean;
  body: string;
  created_at: string;
}

export type ModerationCaseRow = {
  id: string;
  campaign_id: string;
  status: ModerationDecision;
  risk_score: number;
  assigned_to: string | null;
  internal_notes: string | null;
  decision_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminActionRow = {
  id: string;
  actor_id: string;
  action: string;
  subject_type: string;
  subject_id: string | null;
  justification: string;
  metadata: Record<string, unknown> | null;
  second_approver_id: string | null;
  created_at: string;
}

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  event: string;
  subject_type: string | null;
  subject_id: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

export type WebhookEventRow = {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: "received" | "processed" | "failed" | "skipped";
  error: string | null;
  received_at: string;
  processed_at: string | null;
}

export type OutboxEventRow = {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
  status: "pending" | "processing" | "delivered" | "failed";
  attempts: number;
  next_attempt_at: string;
  last_error: string | null;
  created_at: string;
  processed_at: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow>;
      user_roles: TableDef<UserRoleRow>;
      user_private_details: TableDef<UserPrivateDetailsRow>;
      user_consents: TableDef<UserConsentRow>;
      user_protection_settings: TableDef<UserProtectionSettingsRow>;
      categories: TableDef<CategoryRow>;
      campaigns: TableDef<CampaignRow>;
      campaign_images: TableDef<CampaignImageRow>;
      campaign_documents: TableDef<CampaignDocumentRow>;
      campaign_rules_versions: TableDef<CampaignRulesVersionRow>;
      campaign_eligibility_regions: TableDef<CampaignEligibilityRegionRow>;
      campaign_questions: TableDef<CampaignQuestionRow>;
      favorites: TableDef<FavoriteRow>;
      jurisdictions: TableDef<JurisdictionRow>;
      jurisdiction_rules: TableDef<JurisdictionRuleRow>;
      jurisdiction_campaign_types: TableDef<JurisdictionCampaignTypeRow>;
      jurisdiction_categories: TableDef<JurisdictionCategoryRow>;
      compliance_decisions: TableDef<ComplianceDecisionRow>;
      geo_checks: TableDef<GeoCheckRow>;
      feature_flags: TableDef<FeatureFlagRow>;
      seller_profiles: TableDef<SellerProfileRow>;
      identity_verifications: TableDef<IdentityVerificationRow>;
      entry_orders: TableDef<EntryOrderRow>;
      entries: TableDef<EntryRow>;
      free_entry_requests: TableDef<FreeEntryRequestRow>;
      skill_questions: TableDef<SkillQuestionRow>;
      skill_question_options: TableDef<SkillQuestionOptionRow>;
      skill_responses: TableDef<SkillResponseRow>;
      payment_customers: TableDef<PaymentCustomerRow>;
      payment_transactions: TableDef<PaymentTransactionRow>;
      refunds: TableDef<RefundRow>;
      financial_ledger: TableDef<FinancialLedgerRow>;
      seller_balances: TableDef<SellerBalanceRow>;
      payouts: TableDef<PayoutRow>;
      platform_fees: TableDef<PlatformFeeRow>;
      draws: TableDef<DrawRow>;
      draw_snapshots: TableDef<DrawSnapshotRow>;
      draw_entries: TableDef<DrawEntryRow>;
      winner_verifications: TableDef<WinnerVerificationRow>;
      prize_fulfilments: TableDef<PrizeFulfilmentRow>;
      notifications: TableDef<NotificationRow>;
      notification_preferences: TableDef<NotificationPreferenceRow>;
      reports: TableDef<ReportRow>;
      disputes: TableDef<DisputeRow>;
      support_threads: TableDef<SupportThreadRow>;
      support_messages: TableDef<SupportMessageRow>;
      moderation_cases: TableDef<ModerationCaseRow>;
      admin_actions: TableDef<AdminActionRow>;
      audit_logs: TableDef<AuditLogRow>;
      webhook_events: TableDef<WebhookEventRow>;
      outbox_events: TableDef<OutboxEventRow>;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: { p_user_id: string; p_role: string };
        Returns: boolean;
      };
      create_entry_order: {
        Args: {
          p_campaign_id: string;
          p_quantity: number;
          p_source: EntrySource;
          p_idempotency_key: string;
          p_declared_country: string | null;
          p_skill_response_id: string | null;
        };
        Returns: EntryOrderRow;
      };
      confirm_entry_order: {
        Args: { p_order_id: string; p_payment_transaction_id: string | null };
        Returns: EntryOrderRow;
      };
      cancel_entry_order: {
        Args: { p_order_id: string; p_reason: string };
        Returns: EntryOrderRow;
      };
      submit_skill_response: {
        Args: { p_question_id: string; p_option_id: string };
        Returns: SkillResponseRow;
      };
      transition_campaign_status: {
        Args: { p_campaign_id: string; p_new_status: CampaignStatus; p_reason: string | null };
        Returns: CampaignRow;
      };
      check_entry_eligibility: {
        Args: {
          p_campaign_id: string;
          p_country_code: string;
          p_subdivision_code: string | null;
          p_quantity: number;
        };
        Returns: { allowed: boolean; reasons: string[] };
      };
      close_campaign_entries: {
        Args: { p_campaign_id: string };
        Returns: CampaignRow;
      };
      create_draw_snapshot: {
        Args: { p_campaign_id: string };
        Returns: DrawRow;
      };
      select_draw_winner: {
        Args: { p_draw_id: string; p_random_value: number; p_seed_hash: string };
        Returns: DrawRow;
      };
      record_ledger_entry: {
        Args: {
          p_entry_type: string;
          p_account: string;
          p_account_ref: string | null;
          p_campaign_id: string | null;
          p_payment_transaction_id: string | null;
          p_amount_minor: number;
          p_currency: string;
          p_memo: string | null;
          p_idempotency_key: string | null;
        };
        Returns: string;
      };
      get_my_roles: {
        Args: Record<string, never>;
        Returns: { role: UserRole }[];
      };
    };
    Enums: {
      user_role: UserRole;
      campaign_status: CampaignStatus;
      campaign_type: CampaignType;
      payment_status: PaymentStatus;
      payout_status: PayoutStatus;
      verification_status: VerificationStatus;
      entry_status: EntryStatus;
      entry_source: EntrySource;
      order_status: OrderStatus;
      draw_status: DrawStatus;
      fulfilment_status: FulfilmentStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
