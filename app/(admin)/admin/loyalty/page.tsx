import { prisma } from "@/lib/prisma";
import LoyaltyRulesManager from "@/components/admin/LoyaltyRulesManager";

export default async function LoyaltyPage() {
  const rules = await prisma.loyaltyRule.findMany({
    orderBy: { createdAt: "desc" },
    include: { rewardProduct: true },
  });

  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true },
  });

  const events = await prisma.loyaltyEvent.findMany({
    take: 20,
    orderBy: { triggeredAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      rule: { select: { name: true } },
      coupon: { select: { code: true } },
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Fidelidade</h1>
      <LoyaltyRulesManager rules={rules} products={products} events={events} />
    </div>
  );
}
