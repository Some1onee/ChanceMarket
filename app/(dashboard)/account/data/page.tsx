import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { DataPrivacyActions } from "@/features/profiles/components/data-privacy";

export const metadata: Metadata = { title: "Data & privacy" };

export default async function DataPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Data &amp; privacy</h2>
      <DataPrivacyActions />
    </div>
  );
}
