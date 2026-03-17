import { prisma } from "@/lib/prisma";
import { resend, ADMIN_EMAIL, FROM_EMAIL } from "@/lib/resend";

export async function checkAndTriggerLoyalty(userId: string, orderId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const rules = await prisma.loyaltyRule.findMany({ where: { active: true } });

  for (const rule of rules) {
    let triggered = false;

    if (rule.metricType === "ORDER_COUNT") {
      const count = user.totalCompletedOrders;
      if (count > 0 && count % rule.metricValue === 0) {
        const alreadyTriggered = await prisma.loyaltyEvent.findFirst({
          where: {
            userId,
            ruleId: rule.id,
            triggeredAt: {
              gte: new Date(Date.now() - 1000 * 60 * 5),
            },
          },
        });
        if (!alreadyTriggered) triggered = true;
      }
    }

    if (rule.metricType === "TOTAL_SPENT") {
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

    if (rule.metricType === "ORDERS_IN_PERIOD" && rule.periodDays) {
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

    const code = `${rule.couponPrefix}-${userId.slice(0, 6).toUpperCase()}-${Date.now()}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + rule.couponExpiryDays);

    let discountType: "PERCENT" | "FIXED" | "FREE_ITEM";
    if (rule.rewardType === "DISCOUNT_PERCENT") discountType = "PERCENT";
    else if (rule.rewardType === "DISCOUNT_FIXED") discountType = "FIXED";
    else discountType = "FREE_ITEM";

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

    await prisma.user.update({
      where: { id: userId },
      data: { totalCompletedOrders: { increment: 1 } },
    });

    let benefitText = "";
    if (rule.rewardType === "DISCOUNT_PERCENT")
      benefitText = `${rule.rewardValue}% de desconto`;
    else if (rule.rewardType === "DISCOUNT_FIXED")
      benefitText = `R$${rule.rewardValue?.toFixed(2)} de desconto`;
    else benefitText = "um item gratis";

    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: "Voce ganhou uma recompensa!",
      html: `
        <h2>Parabens, ${user.name}!</h2>
        <p>Voce ganhou <strong>${benefitText}</strong> como recompensa pela sua fidelidade!</p>
        <p>Use o cupom abaixo no seu proximo pedido:</p>
        <h1 style="letter-spacing:4px;color:#f97316">${code}</h1>
        <p>Valido ate: ${expiresAt.toLocaleDateString("pt-BR")}</p>
      `,
    });
  }
}
