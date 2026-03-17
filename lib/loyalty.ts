import { prisma } from "@/lib/prisma";
import { resend, ADMIN_EMAIL, FROM_EMAIL } from "@/lib/resend";
import { MetricType, RewardType, DiscountType } from "@prisma/client";

export async function checkAndTriggerLoyalty(userId: string, orderId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const rules = await prisma.loyaltyRule.findMany({ where: { active: true } });

  for (const rule of rules) {
    let triggered = false;

    // ── ORDER_COUNT ──────────────────────────────────────────────────────────
    if (rule.metricType === MetricType.ORDER_COUNT) {
      const count = user.totalCompletedOrders;
      if (count > 0 && count % rule.metricValue === 0) {
        const cycle = Math.floor(count / rule.metricValue);
        const alreadyTriggered = await prisma.loyaltyEvent.findFirst({
          where: {
            userId,
            ruleId: rule.id,
            triggeredAt: {
              gte: new Date(Date.now() - 1000 * 60 * 5), // evita duplicatas em 5min
            },
          },
        });
        if (!alreadyTriggered) triggered = true;
      }
    }

    // ── TOTAL_SPENT ──────────────────────────────────────────────────────────
    if (rule.metricType === MetricType.TOTAL_SPENT) {
      const totalSpent = await prisma.order.aggregate({
        where: { customerId: userId, status: "DELIVERED" },
        _sum: { total: true },
      });
      const spent = totalSpent._sum.total ?? 0;
      const cycle = Math.floor(spent / rule.metricValue);
      if (cycle > 0) {
        const existingEvents = await prisma.loyaltyEvent.count({
          where: { userId, ruleId: rule.id },
        });
        if (cycle > existingEvents) triggered = true;
      }
    }

    // ── ORDERS_IN_PERIOD ─────────────────────────────────────────────────────
    if (rule.metricType === MetricType.ORDERS_IN_PERIOD && rule.periodDays) {
      const since = new Date();
      since.setDate(since.getDate() - rule.periodDays);

      const countInPeriod = await prisma.order.count({
        where: {
          customerId: userId,
          status: "DELIVERED",
          updatedAt: { gte: since },
        },
      });

      if (countInPeriod >= rule.metricValue) {
        // só dispara se não há cupom de fidelidade não usado para essa regra
        const unusedCoupon = await prisma.loyaltyEvent.findFirst({
          where: {
            userId,
            ruleId: rule.id,
            coupon: { active: true, usedCount: 0 },
          },
          include: { coupon: true },
        });
        if (!unusedCoupon) triggered = true;
      }
    }

    if (!triggered) continue;

    // ── Gerar cupom ──────────────────────────────────────────────────────────
    const code = `${rule.couponPrefix}-${userId.slice(0, 6).toUpperCase()}-${Date.now()}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + rule.couponExpiryDays);

    let discountType: DiscountType;
    if (rule.rewardType === RewardType.DISCOUNT_PERCENT)
      discountType = DiscountType.PERCENT;
    else if (rule.rewardType === RewardType.DISCOUNT_FIXED)
      discountType = DiscountType.FIXED;
    else discountType = DiscountType.FREE_ITEM;

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue: rule.rewardValue ?? 0,
        freeProductId: rule.rewardProductId ?? null,
        expiresAt,
        active: true,
        isLoyaltyReward: true,
        maxUses: 1,
      },
    });

    await prisma.loyaltyEvent.create({
      data: {
        userId,
        ruleId: rule.id,
        orderId,
        couponId: coupon.id,
      },
    });

    // ── Incrementar pedidos completados ──────────────────────────────────────
    await prisma.user.update({
      where: { id: userId },
      data: { totalCompletedOrders: { increment: 1 } },
    });

    // ── E-mail pro cliente ───────────────────────────────────────────────────
    let benefitText = "";
    if (rule.rewardType === RewardType.DISCOUNT_PERCENT)
      benefitText = `${rule.rewardValue}% de desconto`;
    else if (rule.rewardType === RewardType.DISCOUNT_FIXED)
      benefitText = `R$${rule.rewardValue?.toFixed(2)} de desconto`;
    else benefitText = "um item grátis";

    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: "🎉 Você ganhou uma recompensa!",
      html: `
        <h2>Parabéns, ${user.name}!</h2>
        <p>Você ganhou <strong>${benefitText}</strong> como recompensa pela sua fidelidade!</p>
        <p>Use o cupom abaixo no seu próximo pedido:</p>
        <h1 style="letter-spacing:4px;color:#f97316">${code}</h1>
        <p>Válido até: ${expiresAt.toLocaleDateString("pt-BR")}</p>
      `,
    });
  }
}
