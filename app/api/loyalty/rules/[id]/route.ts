import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).optional(),
  active: z.boolean().optional(),
  metricType: z
    .enum(["ORDER_COUNT", "TOTAL_SPENT", "ORDERS_IN_PERIOD"])
    .optional(),
  metricValue: z.number().min(1).optional(),
  periodDays: z.number().optional(),
  rewardType: z
    .enum(["DISCOUNT_PERCENT", "DISCOUNT_FIXED", "FREE_ITEM"])
    .optional(),
  rewardValue: z.number().optional(),
  rewardProductId: z.string().optional(),
  couponPrefix: z.string().optional(),
  couponExpiryDays: z.number().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );

    const rule = await prisma.loyaltyRule.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(rule);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await prisma.loyaltyRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
