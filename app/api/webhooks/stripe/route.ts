import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { resend, ADMIN_EMAIL, FROM_EMAIL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Webhook invalido" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as {
      id: string;
      metadata: Record<string, string>;
    };

    const order = await prisma.order.update({
      where: { stripePaymentIntentId: pi.id },
      data: { paymentStatus: "PAID", status: "CONFIRMED" },
      include: {
        customer: true,
        items: { include: { product: true } },
        address: true,
      },
    });

    if (order.couponId) {
      await prisma.coupon.update({
        where: { id: order.couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Notifica cliente em tempo real
    await pusherServer.trigger(`order-${order.id}`, "order-status-updated", {
      status: "CONFIRMED",
      paymentStatus: "PAID",
    });

    // Cria notificacao admin
    const notification = await prisma.adminNotification.create({
      data: {
        type: "NEW_ORDER",
        orderId: order.id,
        message: `Novo pedido #${order.id.slice(0, 8)} — R$${order.total.toFixed(2)}`,
      },
    });

    // Notifica admin em tempo real
    await pusherServer.trigger("admin-notifications", "new-notification", {
      id: notification.id,
      type: "NEW_ORDER",
      message: notification.message,
      orderId: order.id,
    });

    // Email admin
    const itemsList = order.items
      .map(
        (i) =>
          `<li>${i.quantity}x ${i.product.name} — R$${(i.unitPrice * i.quantity).toFixed(2)}</li>`,
      )
      .join("");

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Novo pedido #${order.id.slice(0, 8)} — R$${order.total.toFixed(2)}`,
      html: `
        <h2>Novo pedido recebido!</h2>
        <p><strong>Cliente:</strong> ${order.customer.name} (${order.customer.email})</p>
        <p><strong>Endereco:</strong> ${order.address.street}, ${order.address.number} - ${order.address.neighborhood}</p>
        <ul>${itemsList}</ul>
        <p><strong>Total: R$${order.total.toFixed(2)}</strong></p>
      `,
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as { id: string };

    const order = await prisma.order.update({
      where: { stripePaymentIntentId: pi.id },
      data: { paymentStatus: "FAILED" },
    });

    await pusherServer.trigger(`order-${order.id}`, "order-status-updated", {
      status: "PENDING",
      paymentStatus: "FAILED",
    });

    await prisma.adminNotification.create({
      data: {
        type: "PAYMENT_FAILED",
        orderId: order.id,
        message: `Falha no pagamento do pedido #${order.id.slice(0, 8)}`,
      },
    });
  }

  return NextResponse.json({ received: true });
}
