import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { resend, ADMIN_EMAIL, FROM_EMAIL } from "@/lib/resend";
import { checkAndTriggerLoyalty } from "@/lib/loyalty";

const schema = z.object({
  status: z.enum([
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
  courierId: z.string().optional(),
  estimatedDeliveryTime: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "COURIER")
    )
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

    const { status, courierId, estimatedDeliveryTime } = parsed.data;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(courierId && { courierId }),
        ...(estimatedDeliveryTime && {
          estimatedDeliveryTime: new Date(estimatedDeliveryTime),
        }),
      },
      include: {
        customer: true,
        items: { include: { product: true } },
        address: true,
      },
    });

    await pusherServer.trigger(`order-${id}`, "order-status-updated", {
      status,
      estimatedDeliveryTime,
    });

    if (status === "DELIVERED") {
      await checkAndTriggerLoyalty(order.customerId, order.id);
    }

    if (status === "CANCELLED") {
      await prisma.adminNotification.create({
        data: {
          type: "ORDER_CANCELLED",
          orderId: order.id,
          message: `Pedido #${order.id.slice(0, 8)} cancelado`,
        },
      });

      await pusherServer.trigger("admin-notifications", "new-notification", {
        type: "ORDER_CANCELLED",
        message: `Pedido #${order.id.slice(0, 8)} cancelado`,
        orderId: order.id,
      });

      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `Pedido #${order.id.slice(0, 8)} cancelado`,
        html: `<p>O pedido de <strong>${order.customer.name}</strong> foi cancelado.</p>`,
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("PATCH /orders/[id]/status error:", error);
    return NextResponse.json(
      { error: "Erro interno", details: String(error) },
      { status: 500 },
    );
  }
}
