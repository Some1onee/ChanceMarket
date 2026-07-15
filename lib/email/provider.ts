import "server-only";

import { logInfo } from "@/lib/observability/logger";

/**
 * EmailProvider abstraction. The "log" provider (default) writes structured
 * log lines — safe for development. Real providers (Resend, Postmark, SES…)
 * implement the same interface behind EMAIL_PROVIDER.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<{ id: string }>;
}

class LogEmailProvider implements EmailProvider {
  readonly name = "log";

  async send(message: EmailMessage): Promise<{ id: string }> {
    const id = `log_${crypto.randomUUID()}`;
    logInfo("email_sent_log_provider", {
      id,
      to: message.to.replace(/(.).+(@.*)/, "$1***$2"),
      subject: message.subject,
    });
    return { id };
  }
}

export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? "log";
  switch (provider) {
    case "log":
      return new LogEmailProvider();
    default:
      throw new Error(
        `Email provider "${provider}" has no adapter. Add one in lib/email/provider.ts behind the EmailProvider interface.`,
      );
  }
}
