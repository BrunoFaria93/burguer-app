import { prisma } from "@/lib/prisma";
import CustomersTable from "@/components/admin/CustomersTable";

export default async function CustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        where: { paymentStatus: "PAID" },
        select: { total: true, status: true, createdAt: true },
      },
      loyaltyEvents: {
        include: { coupon: { select: { code: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <CustomersTable customers={customers} />
    </div>
  );
}
