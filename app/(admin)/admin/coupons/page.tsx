import { prisma } from "@/lib/prisma";
import CouponsManager from "@/components/admin/CouponsManager";

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { freeProduct: { select: { name: true } } },
  });

  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cupons</h1>
      <CouponsManager coupons={coupons} products={products} />
    </div>
  );
}
