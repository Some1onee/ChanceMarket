import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { ChangePasswordCard, SessionsCard } from "@/features/profiles/components/security-forms";

export const metadata: Metadata = { title: "Security" };

export default async function SecurityPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Security</h2>
      <ChangePasswordCard />
      <SessionsCard />
    </div>
  );
}
