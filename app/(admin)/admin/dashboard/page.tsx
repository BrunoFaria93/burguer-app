import { prisma } from "@/lib/prisma";
import RecentOrders from "@/components/admin/RecentOrders";

type RecentOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
  customer: { name: string };
  items: { id: string }[];
};

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    ordersToday,
    revenueToday,
    pendingOrders,
    onlineCouriers,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today }, paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING"] } },
    }),
    prisma.courier.count({ where: { status: "AVAILABLE" } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true },
    }),
  ]);

  const cards = [
    { label: "Pedidos hoje", value: ordersToday, color: "text-blue-500" },
    {
      label: "Receita hoje",
      value: `R$ ${(revenueToday._sum.total ?? 0).toFixed(2)}`,
      color: "text-green-500",
    },
    {
      label: "Pedidos pendentes",
      value: pendingOrders,
      color: "text-orange-500",
    },
    {
      label: "Motoqueiros online",
      value: onlineCouriers,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-6"
          >
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              {label}
            </p>
            <p
              className={`mt-2 text-xl md:text-3xl font-bold whitespace-nowrap ${color}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <RecentOrders
        initial={recentOrders.map((o: RecentOrder) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
