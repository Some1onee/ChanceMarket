import { brand } from "@/lib/config/brand";

/**
 * Versioned transactional email templates. Each template returns subject,
 * HTML and plain text. Bump `version` when copy changes materially — the
 * version is embedded in the footer for auditability.
 */

export type TemplateKey =
  | "welcome"
  | "entry_confirmed"
  | "payment_failed"
  | "refund"
  | "campaign_submitted"
  | "campaign_approved"
  | "campaign_changes_requested"
  | "campaign_rejected"
  | "campaign_ending_soon"
  | "campaign_closed"
  | "winner_provisional"
  | "winner_confirmed"
  | "prize_handover"
  | "support_message"
  | "dispute_update"
  | "seller_approved";

export type TemplateInput = {
  displayName: string;
  body?: string;
  href?: string;
};

type Template = {
  version: number;
  subject: (input: TemplateInput) => string;
  heading: (input: TemplateInput) => string;
  paragraph: (input: TemplateInput) => string;
  cta?: { label: string; path: string };
};

const templates: Record<TemplateKey, Template> = {
  welcome: {
    version: 1,
    subject: () => `Welcome to ${brand.name}`,
    heading: ({ displayName }) => `Welcome, ${displayName}`,
    paragraph: () =>
      "Your account is ready. Browse live competitions, set your play safeguards, and remember: where a free entry route applies, it always carries identical chances.",
    cta: { label: "Browse competitions", path: "/campaigns" },
  },
  entry_confirmed: {
    version: 1,
    subject: () => "Your entry is confirmed",
    heading: () => "Entry confirmed",
    paragraph: ({ body }) => body ?? "Your entries are confirmed. Good luck!",
    cta: { label: "View my entries", path: "/account/entries" },
  },
  payment_failed: {
    version: 1,
    subject: () => "Payment failed — no entries issued",
    heading: () => "Payment failed",
    paragraph: ({ body }) =>
      body ?? "Your payment did not go through. No entries were issued and nothing was charged.",
    cta: { label: "Try again", path: "/campaigns" },
  },
  refund: {
    version: 1,
    subject: () => "Refund issued",
    heading: () => "Refund issued",
    paragraph: ({ body }) => body ?? "A refund has been issued to your original payment method.",
    cta: { label: "View receipts", path: "/account/entries" },
  },
  campaign_submitted: {
    version: 1,
    subject: () => "Campaign submitted for review",
    heading: () => "Campaign submitted",
    paragraph: () =>
      "Our moderation team is reviewing your campaign. We'll notify you of the decision.",
    cta: { label: "Seller dashboard", path: "/seller" },
  },
  campaign_approved: {
    version: 1,
    subject: () => "Your campaign is live",
    heading: () => "Campaign approved",
    paragraph: ({ body }) => body ?? "Your campaign passed moderation and is now live.",
    cta: { label: "Seller dashboard", path: "/seller" },
  },
  campaign_changes_requested: {
    version: 1,
    subject: () => "Changes requested on your campaign",
    heading: () => "Changes requested",
    paragraph: ({ body }) =>
      body ?? "Moderation asked for changes before your campaign can go live.",
    cta: { label: "Edit campaign", path: "/seller" },
  },
  campaign_rejected: {
    version: 1,
    subject: () => "Campaign rejected",
    heading: () => "Campaign rejected",
    paragraph: ({ body }) =>
      body ?? "Your campaign cannot be listed. The reason is in your dashboard.",
    cta: { label: "Seller dashboard", path: "/seller" },
  },
  campaign_ending_soon: {
    version: 1,
    subject: () => "Ending soon — a campaign you follow",
    heading: () => "Ending soon",
    paragraph: ({ body }) => body ?? "A campaign you follow closes soon.",
    cta: { label: "View campaign", path: "/campaigns" },
  },
  campaign_closed: {
    version: 1,
    subject: () => "Campaign closed — draw pending",
    heading: () => "Entries closed",
    paragraph: ({ body }) =>
      body ??
      "The campaign has closed. The draw runs on our servers and the record will be public.",
    cta: { label: "Draw records", path: "/draws" },
  },
  winner_provisional: {
    version: 1,
    subject: () => "You are the provisional winner!",
    heading: () => "Provisional winner",
    paragraph: ({ body }) =>
      body ??
      "You were selected by the draw, subject to eligibility verification. We'll guide you through the next steps.",
    cta: { label: "My entries", path: "/account/entries" },
  },
  winner_confirmed: {
    version: 1,
    subject: () => "Congratulations — you won!",
    heading: () => "Winner confirmed",
    paragraph: ({ body }) => body ?? "Your eligibility is verified. Prize handover starts now.",
    cta: { label: "My entries", path: "/account/entries" },
  },
  prize_handover: {
    version: 1,
    subject: () => "Prize handover update",
    heading: () => "Prize handover",
    paragraph: ({ body }) => body ?? "There is an update on your prize handover.",
    cta: { label: "My entries", path: "/account/entries" },
  },
  support_message: {
    version: 1,
    subject: () => "New message from support",
    heading: () => "Support replied",
    paragraph: ({ body }) => body ?? "You have a new message from our support team.",
    cta: { label: "Open conversation", path: "/help" },
  },
  dispute_update: {
    version: 1,
    subject: () => "Update on your dispute",
    heading: () => "Dispute update",
    paragraph: ({ body }) => body ?? "There is an update on your dispute.",
    cta: { label: "View details", path: "/account" },
  },
  seller_approved: {
    version: 1,
    subject: () => "Your seller application was approved",
    heading: () => "You can start selling",
    paragraph: () => "Your seller application is approved — create your first campaign draft.",
    cta: { label: "Seller dashboard", path: "/seller" },
  },
};

export function renderEmail(
  key: TemplateKey,
  input: TemplateInput,
): { subject: string; html: string; text: string } {
  const template = templates[key];
  const subject = template.subject(input);
  const heading = template.heading(input);
  const paragraph = template.paragraph(input);
  const ctaUrl = template.cta ? `${brand.url}${input.href ?? template.cta.path}` : null;

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#FAFAF7;font-family:Helvetica,Arial,sans-serif;color:#1F2328;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <p style="font-size:18px;font-weight:700;margin:0 0 24px;">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${brand.colors.accent};margin-right:8px;"></span>${brand.wordmark.primary}<span style="color:${brand.colors.primary}">${brand.wordmark.secondary}</span>
    </p>
    <div style="background:#FFFFFF;border:1px solid #E4E4DD;border-radius:12px;padding:28px;">
      <h1 style="font-size:20px;margin:0 0 12px;">${heading}</h1>
      <p style="font-size:14px;line-height:1.6;color:#5B6069;margin:0 0 20px;">${paragraph}</p>
      ${
        ctaUrl && template.cta
          ? `<a href="${ctaUrl}" style="display:inline-block;background:${brand.colors.primary};color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:8px;">${template.cta.label}</a>`
          : ""
      }
    </div>
    <p style="font-size:11px;color:#9AA1B0;margin:20px 0 0;">
      ${brand.name} · template ${key} v${template.version} · Manage preferences in your account.
      Please participate responsibly.
    </p>
  </div>
</body>
</html>`;

  const text = `${heading}\n\n${paragraph}\n${ctaUrl ? `\n${template.cta?.label}: ${ctaUrl}` : ""}\n\n${brand.name} — template ${key} v${template.version}`;

  return { subject, html, text };
}
