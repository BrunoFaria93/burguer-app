import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

const schema = z.object({
  addressId: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      extras: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
          }),
        )
        .optional(),
    }),
  ),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const role = session.user.role;
    const userId = session.user.id;

    const orders = await prisma.order.findMany({
      where: role === "CUSTOMER" ? { customerId: userId } : {},
      include: {
        customer: true,
        items: { include: { product: true } },
        address: true,
        courier: { include: { user: true } },
        coupon: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

    const { addressId, items, couponCode, notes } = parsed.data;
    const userId = session.user.id as string;

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product)
        return NextResponse.json(
          { error: `Produto ${item.productId} nao encontrado` },
          { status: 404 },
        );

      const extrasTotal = (item.extras ?? []).reduce(
        (sum, e) => sum + e.price,
        0,
      );
      const unitPrice = product.price + extrasTotal;
      subtotal += unitPrice * item.quantity;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        extras: item.extras ?? [],
      });
    }

    let discountAmount = 0;
    let couponId: string | undefined;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });
      if (!coupon || !coupon.active)
        return NextResponse.json({ error: "Cupom invalido" }, { status: 400 });
      if (coupon.expiresAt && coupon.expiresAt < new Date())
        return NextResponse.json({ error: "Cupom expirado" }, { status: 400 });
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
        return NextResponse.json({ error: "Cupom esgotado" }, { status: 400 });
      if (subtotal < coupon.minOrderValue)
        return NextResponse.json(
          { error: `Pedido minimo de R$${coupon.minOrderValue}` },
          { status: 400 },
        );

      if (coupon.discountType === "PERCENT")
        discountAmount = subtotal * (coupon.discountValue / 100);
      else if (coupon.discountType === "FIXED")
        discountAmount = coupon.discountValue;

      couponId = coupon.id;
    }

    const deliverySetting = await prisma.setting.findUnique({
      where: { key: "deliveryFee" },
    });
    const deliveryFee = parseFloat(deliverySetting?.value ?? "5");
    const total = subtotal - discountAmount + deliveryFee;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: "brl",
      metadata: { userId, addressId, notes: notes ?? "" },
    });

    const order = await prisma.order.create({
      data: {
        customerId: userId,
        addressId,
        couponId,
        subtotal,
        discountAmount,
        deliveryFee,
        total,
        notes,
        stripePaymentIntentId: paymentIntent.id,
        items: { create: orderItems },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
        address: true,
      },
    });

    return NextResponse.json(
      {
        order,
        clientSecret: paymentIntent.client_secret,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
