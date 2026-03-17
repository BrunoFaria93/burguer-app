import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CourierOrders from "@/components/courier/CourierOrders";

export default async function CourierPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const courier = await prisma.courier.findUnique({
    where: { userId: session.user.id },
  });

  if (!courier) redirect("/login");

  const orders = await prisma.order.findMany({
    where: {
      courierId: courier.id,
      status: { in: ["READY", "OUT_FOR_DELIVERY"] },
    },
    include: {
      customer: true,
      address: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const deliveredToday = await prisma.order.findMany({
    where: {
      courierId: courier.id,
      status: "DELIVERED",
      updatedAt: { gte: todayStart },
    },
    include: {
      customer: true,
      address: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-xl border-zinc-800/60 bg-zinc-900/50 p-6 text-white">
        <p className="text-sm opacity-80">Bem-vindo,</p>
        <h1 className="text-2xl font-bold">{session.user.name}</h1>
        <p className="mt-1 text-sm opacity-80">
          {deliveredToday.length} entrega(s) concluída(s) hoje
        </p>
      </div>

      <CourierOrders
        activeOrders={orders}
        deliveredToday={deliveredToday}
        courierId={courier.id}
      />
    </div>
  );
}
