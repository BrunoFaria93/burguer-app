import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/customer/AddToCartButton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-gray-100">
      {/* Imagem hero do produto */}
      <div className="relative h-72 w-full overflow-hidden bg-gray-200 sm:h-96">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            Sem imagem
          </div>
        )}
        {/* Overlay gradiente no fundo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Botao voltar */}
        <Link
          href="/"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
        >
          <ArrowLeft size={18} />
        </Link>
      </div>

      {/* Conteudo */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Card branco com info do produto */}
        <div className="-mt-6 rounded-3xl bg-white px-6 pt-6 pb-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
            {product.category.name}
          </p>
          <h1 className="mt-1 text-2xl font-black text-gray-900 sm:text-3xl">
            {product.name}
          </h1>
          {product.description && (
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              {product.description}
            </p>
          )}
          <div className="mt-4 flex items-center gap-4">
            <p className="text-3xl font-black text-orange-500">
              R$ {product.price.toFixed(2)}
            </p>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
              {product.preparationTime} min
            </span>
          </div>
        </div>

        {/* Extras e botao de adicionar */}
        <div className="mt-4">
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
