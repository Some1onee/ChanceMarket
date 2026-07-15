import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AccountNav } from "@/features/profiles/components/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?next=/account");

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[220px_1fr]">
      <aside>
        <h1 className="font-display mb-4 text-xl font-bold">Account</h1>
        <AccountNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
