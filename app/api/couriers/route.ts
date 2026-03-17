import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({
  userId: z.string(),
  vehicleType: z.string().min(1),
  licensePlate: z.string().min(1),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const couriers = await prisma.courier.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    });
    return NextResponse.json(couriers);
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

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { role: "COURIER" },
    });

    const courier = await prisma.courier.create({
      data: parsed.data,
      include: { user: true },
    });
    return NextResponse.json(courier, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
