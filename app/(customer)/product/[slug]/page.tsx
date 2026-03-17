import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/customer/AddToCartButton";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { extras: true, category: true },
  });

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-zinc-800">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-600 text-sm">
              Sem imagem
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-orange-400">
            {product.category.name}
          </p>
          <h1 className="mt-1 text-3xl font-black">{product.name}</h1>
          {product.description && (
            <p className="mt-3 text-zinc-400">{product.description}</p>
          )}
          <p className="mt-4 text-3xl font-black text-orange-500">
            R$ {product.price.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Tempo de preparo: {product.preparationTime} min
          </p>
        </div>

        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
