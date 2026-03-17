import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2),
  metricType: z.enum(["ORDER_COUNT", "TOTAL_SPENT", "ORDERS_IN_PERIOD"]),
  metricValue: z.number().min(1),
  periodDays: z.number().optional(),
  rewardType: z.enum(["DISCOUNT_PERCENT", "DISCOUNT_FIXED", "FREE_ITEM"]),
  rewardValue: z.number().optional(),
  rewardProductId: z.string().optional(),
  couponPrefix: z.string().default("FIEL"),
  couponExpiryDays: z.number().default(30),
  active: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const rules = await prisma.loyaltyRule.findMany({
      orderBy: { createdAt: "desc" },
      include: { rewardProduct: true },
    });
    return NextResponse.json(rules);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const rule = await prisma.loyaltyRule.create({ data: parsed.data });
    return NextResponse.json(rule, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
