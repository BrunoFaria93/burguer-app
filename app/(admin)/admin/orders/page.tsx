import { prisma } from "@/lib/prisma";
import OrdersTable from "@/components/admin/OrdersTable";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      courier: { include: { user: true } },
      items: { include: { product: true } },
      address: true,
    },
  });

  const couriers = await prisma.courier.findMany({
    where: { status: "AVAILABLE" },
    include: { user: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>
      <OrdersTable orders={orders} couriers={couriers} />
    </div>
  );
}
