import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({
  code: z.string().min(2).toUpperCase(),
  discountType: z.enum(["PERCENT", "FIXED", "FREE_ITEM"]),
  discountValue: z.number().min(0).optional(),
  freeProductId: z.string().optional(),
  minOrderValue: z.number().min(0).optional(),
  maxUses: z.number().optional(),
  expiresAt: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { freeProduct: { select: { name: true } } },
    });
    return NextResponse.json(coupons);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

    const existing = await prisma.coupon.findUnique({
      where: { code: parsed.data.code },
    });
    if (existing)
      return NextResponse.json({ error: "Codigo ja existe" }, { status: 409 });

    const coupon = await prisma.coupon.create({
      data: {
        ...parsed.data,
        discountValue: parsed.data.discountValue ?? 0,
        minOrderValue: parsed.data.minOrderValue ?? 0,
        expiresAt: parsed.data.expiresAt
          ? new Date(parsed.data.expiresAt)
          : null,
      },
      include: { freeProduct: { select: { name: true } } },
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
