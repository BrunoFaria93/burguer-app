import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AccountManager from "@/components/customer/AccountManager";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { from } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { addresses: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-12 space-y-8">
        <h1 className="text-3xl font-black">Minha conta</h1>
        <AccountManager user={user} fromCheckout={from === "checkout"} />
      </div>
    </div>
  );
}
