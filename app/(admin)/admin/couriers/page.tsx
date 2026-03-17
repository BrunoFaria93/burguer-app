import { prisma } from "@/lib/prisma";
import CouriersManager from "@/components/admin/CouriersManager";

export default async function CouriersPage() {
  const couriers = await prisma.courier.findMany({
    include: {
      user: true,
      orders: {
        where: {
          status: {
            in: ["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"],
          },
        },
        include: { address: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Motoqueiros</h1>
      <CouriersManager couriers={couriers} />
    </div>
  );
}
