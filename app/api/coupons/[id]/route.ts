import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({
  active: z.boolean().optional(),
  discountValue: z.number().optional(),
  minOrderValue: z.number().optional(),
  maxUses: z.number().optional(),
  expiresAt: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...parsed.data,
        expiresAt: parsed.data.expiresAt
          ? new Date(parsed.data.expiresAt)
          : undefined,
      },
    });
    return NextResponse.json(coupon);
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
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (coupon?.isLoyaltyReward)
      return NextResponse.json(
        { error: "Cupons de fidelidade nao podem ser deletados manualmente." },
        { status: 400 },
      );

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
