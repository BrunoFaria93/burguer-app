import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();

    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.active)
      return NextResponse.json({ error: "Cupom inválido" }, { status: 400 });
    if (coupon.expiresAt && coupon.expiresAt < new Date())
      return NextResponse.json({ error: "Cupom expirado" }, { status: 400 });
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
      return NextResponse.json({ error: "Cupom esgotado" }, { status: 400 });
    if (subtotal < coupon.minOrderValue)
      return NextResponse.json(
        { error: `Pedido mínimo de R$${coupon.minOrderValue}` },
        { status: 400 },
      );

    return NextResponse.json(coupon);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
