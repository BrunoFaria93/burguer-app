import { prisma } from "@/lib/prisma";
import Link from "next/link";
import QuickAddButton from "@/components/customer/QuickAddButton";

export default async function HomePage() {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { position: "asc" },
      include: {
        products: {
          where: { active: true },
          include: { extras: true },
          orderBy: { name: "desc" },
        },
      },
    }),
    prisma.setting.findMany(),
  ]);

  const map = Object.fromEntries(
    settings.map((s: { key: string; value: string }) => [s.key, s.value]),
  );
  const restaurantName = map.restaurantName || "Burger App";
  const estimatedTime = map.estimatedDeliveryTime || "30";
  const deliveryFee = map.deliveryFee || "0";

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative flex items-center overflow-hidden px-4 py-16 sm:px-6 sm:py-24 min-h-[480px]">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="mb-4 inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-orange-400">
                Aberto agora
              </span>
              <h1 className="text-4xl font-black leading-none tracking-tight sm:text-5xl lg:text-7xl">
                {restaurantName.toUpperCase()}
              </h1>
              <p className="mt-4 text-sm text-zinc-400 sm:text-base lg:text-lg">
                Carnes artesanais, pão brioche e muito sabor. Peça agora e
                receba em casa.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#cardapio"
                  className="rounded-xl bg-orange-500 px-8 py-3 text-sm font-bold text-white transition hover:bg-orange-400"
                >
                  Ver cardapio
                </a>
                <Link
                  href="/cart"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-8 py-3 text-sm font-bold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                >
                  Meu carrinho
                </Link>
              </div>
            </div>

            {/* Stats — linha no mobile, coluna no desktop */}
            <div className="flex flex-row gap-3 lg:flex-col">
              {(
                [
                  { value: estimatedTime + "min", label: "Tempo medio" },
                  { value: "4.9", label: "Avaliacao" },
                  {
                    value: "R$" + Number(deliveryFee).toFixed(0),
                    label: "Taxa de entrega",
                  },
                ] as { value: string; label: string }[]
              ).map(({ value, label }) => (
                <div
                  key={label}
                  className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3 py-3 text-center lg:px-6 lg:py-4"
                >
                  <p className="text-lg font-black text-orange-500 lg:text-2xl">
                    {value}
                  </p>
                  <p className="text-[10px] text-zinc-500 lg:text-xs">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-800" />

      {/* Cardápio */}
      <section
        id="cardapio"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      >
        {categories.length === 0 && (
          <div className="py-20 text-center text-zinc-600">
            <p className="text-lg">Cardapio em breve.</p>
          </div>
        )}
        {categories.map((category) => (
          <div key={category.id} className="mb-16">
            <div className="mb-8 flex items-center gap-4">
              <h2 className="text-xl font-black uppercase tracking-widest text-zinc-100">
                {category.name}
              </h2>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.products.map((product) => (
                <div
                  key={product.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-all duration-300 hover:border-orange-500/50 hover:bg-zinc-800/80"
                >
                  <Link href={"/product/" + product.slug} className="block">
                    <div className="relative h-44 overflow-hidden bg-zinc-800">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-700 text-sm">
                          Sem imagem
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="rounded-lg bg-zinc-900/90 px-2 py-1 text-xs font-medium text-zinc-300">
                          {product.preparationTime} min
                        </span>
                      </div>
                    </div>
                    <div className="p-4 pb-2">
                      <h3 className="font-bold text-zinc-100">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center justify-between px-4 pb-4">
                    <p className="text-lg font-black text-orange-500">
                      R$ {product.price.toFixed(2)}
                    </p>
                    <QuickAddButton product={product} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <footer className="border-t border-zinc-800 bg-zinc-900/50 px-6 py-8 text-center">
        <p className="text-sm font-bold text-zinc-400">{restaurantName}</p>
        <p className="mt-1 text-xs text-zinc-600">
          Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
