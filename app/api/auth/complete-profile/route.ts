import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const schema = z.object({
  phone: z.string().min(10, "Telefone inválido"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    console.log(
      "[complete-profile] session.user:",
      JSON.stringify(session?.user),
    );

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    }

    const email = session.user.email;
    const id = session.user.id;

    if (!email && !id) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    // Busca o usuário pelo id ou email
    const user = await prisma.user.findFirst({
      where: id ? { id } : { email: email! },
    });

    console.log("[complete-profile] user encontrado:", user?.id);

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { phone: parsed.data.phone },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[complete-profile] erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
