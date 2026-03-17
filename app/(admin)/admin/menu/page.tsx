import { prisma } from "@/lib/prisma";
import MenuManager from "@/components/admin/MenuManager";

export default async function MenuPage() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: {
      products: {
        include: { extras: true },
        orderBy: { name: "asc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cardápio</h1>
      <MenuManager categories={categories} />
    </div>
  );
}
