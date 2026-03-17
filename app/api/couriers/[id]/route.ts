import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({
  vehicleType: z.string().optional(),
  licensePlate: z.string().optional(),
  status: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]).optional(),
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
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );

    const courier = await prisma.courier.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(courier);
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

    const hasOrders = await prisma.order.findFirst({
      where: {
        courierId: id,
        status: { in: ["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] },
      },
    });

    if (hasOrders) {
      return NextResponse.json(
        {
          error:
            "Nao e possivel remover um motoqueiro com pedidos em andamento.",
        },
        { status: 400 },
      );
    }

    const courier = await prisma.courier.findUnique({ where: { id } });
    if (courier) {
      await prisma.user.update({
        where: { id: courier.userId },
        data: { role: "CUSTOMER" },
      });
    }

    await prisma.courier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
