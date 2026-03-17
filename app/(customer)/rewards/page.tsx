import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function RewardsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/login");

  const rules = await prisma.loyaltyRule.findMany({
    where: { active: true },
    include: { rewardProduct: true },
  });

  const loyaltyCoupons = await prisma.coupon.findMany({
    where: {
      isLoyaltyReward: true,
      active: true,
      loyaltyEvents: { some: { userId: session.user.id } },
    },
  });

  const totalSpent = await prisma.order.aggregate({
    where: { customerId: session.user.id, status: "DELIVERED" },
    _sum: { total: true },
  });

  const spent = totalSpent._sum.total ?? 0;

  function getProgress(rule: (typeof rules)[0]) {
    if (rule.metricType === "ORDER_COUNT") {
      const current = user!.totalCompletedOrders % rule.metricValue;
      const progress = (current / rule.metricValue) * 100;
      const remaining = rule.metricValue - current;
      return {
        current,
        total: rule.metricValue,
        progress,
        remaining,
        label: `${current} de ${rule.metricValue} pedidos`,
        remainingLabel: `Faltam ${remaining} pedido(s)`,
      };
    }
    if (rule.metricType === "TOTAL_SPENT") {
      const cycle = Math.floor(spent / rule.metricValue);
      const current = spent - cycle * rule.metricValue;
      const progress = (current / rule.metricValue) * 100;
      const remaining = rule.metricValue - current;
      return {
        current,
        total: rule.metricValue,
        progress,
        remaining,
        label: `R$ ${current.toFixed(2)} de R$ ${rule.metricValue.toFixed(2)}`,
        remainingLabel: `Faltam R$ ${remaining.toFixed(2)}`,
      };
    }
    return null;
  }

  function getRewardLabel(rule: (typeof rules)[0]) {
    if (rule.rewardType === "DISCOUNT_PERCENT")
      return `${rule.rewardValue}% de desconto`;
    if (rule.rewardType === "DISCOUNT_FIXED")
      return `R$ ${rule.rewardValue?.toFixed(2)} de desconto`;
    if (rule.rewardType === "FREE_ITEM")
      return `${rule.rewardProduct?.name ?? "item"} gratis`;
    return "";
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl font-black">Minhas recompensas</h1>
          <p className="mt-1 text-zinc-400 text-sm">
            Voce tem {user.totalCompletedOrders} pedido(s) concluido(s)
          </p>
        </div>

        {/* Progresso */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Seu progresso</h2>

          {rules.length === 0 && (
            <p className="text-sm text-zinc-500">
              Nenhuma regra de fidelidade ativa no momento.
            </p>
          )}

          {rules.map((rule) => {
            const progress = getProgress(rule);
            if (!progress) return null;

            return (
              <div
                key={rule.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{rule.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Recompensa: {getRewardLabel(rule)}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 ring-1 ring-orange-500/20">
                    {progress.label}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-orange-500 transition-all duration-500"
                      style={{ width: `${Math.min(progress.progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">
                    {progress.remainingLabel} para ganhar sua recompensa!
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Cupons disponíveis */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Cupons disponiveis</h2>

          {loyaltyCoupons.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
              <p className="text-zinc-400 text-sm">
                Nenhum cupom disponivel ainda.
              </p>
              <p className="text-zinc-600 text-xs mt-1">
                Continue pedindo para ganhar recompensas!
              </p>
            </div>
          )}

          <div className="space-y-3">
            {loyaltyCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black tracking-widest text-orange-500">
                      {coupon.code}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {coupon.discountType === "PERCENT" &&
                        `${coupon.discountValue}% de desconto`}
                      {coupon.discountType === "FIXED" &&
                        `R$ ${coupon.discountValue.toFixed(2)} de desconto`}
                      {coupon.discountType === "FREE_ITEM" && "Item gratis"}
                    </p>
                    {coupon.minOrderValue > 0 && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Pedido minimo: R$ {coupon.minOrderValue.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {coupon.expiresAt && (
                      <p className="text-xs text-zinc-500">
                        Valido ate{" "}
                        {new Date(coupon.expiresAt).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    <span className="mt-1 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-500">
                      Disponivel
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Link
          href="/"
          className="block w-full rounded-xl bg-orange-500 py-4 text-center text-sm font-bold text-white transition hover:bg-orange-400"
        >
          Fazer um pedido
        </Link>
      </div>
    </div>
  );
}
