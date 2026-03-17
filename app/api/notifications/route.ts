import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { order: true },
    });

    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await prisma.adminNotification.updateMany({
      where: { read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
