import { prisma } from "@/lib/prisma";
import Link from "next/link";
import QuickAddButton from "@/components/customer/QuickAddButton";

type ProductExtra = { id: string; name: string; price: number };
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  preparationTime: number;
  extras: ProductExtra[];
};
type Category = {
  id: string;
  name: string;
  products: Product[];
};

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
    <div className="min-h-screen bg-gray-100">
      {/* Hero — imagem full screen com header por cima */}
      <section className="relative h-[100svh] min-h-[600px] overflow-hidden">
        {/* Imagem de fundo */}
        <img
          src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1600&q=90&fit=crop"
          alt="Burger"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Overlay gradiente escuro */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />
        {/* Conteudo sobre a imagem */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-xl text-center">
            <span className="mb-3 inline-block rounded-full border border-orange-500/50 bg-orange-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-orange-300">
              Aberto agora
            </span>
            <h1 className="text-5xl font-black leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
              {restaurantName.toUpperCase()}
            </h1>
            <p className="mt-3 text-base text-white/70">
              Carnes artesanais, pao brioche e muito sabor.
            </p>

            {/* Stats */}
            <div className="mt-6 flex gap-3">
              {(
                [
                  { value: estimatedTime + " min", label: "Entrega" },
                  { value: "4.9", label: "Avaliacao" },
                  {
                    value:
                      Number(deliveryFee) === 0
                        ? "Gratis"
                        : "R$" + Number(deliveryFee).toFixed(0),
                    label: "Taxa",
                  },
                ] as { value: string; label: string }[]
              ).map(({ value, label }) => (
                <div
                  key={label}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm"
                >
                  <p className="text-base font-black text-white sm:text-lg">
                    {value}
                  </p>
                  <p className="text-[10px] text-white/60">{label}</p>
                </div>
              ))}
            </div>

            <a
              href="#cardapio"
              className="mt-6 inline-block w-full rounded-2xl bg-orange-500 py-4 text-center text-sm font-bold text-white transition hover:bg-orange-400 sm:w-auto sm:px-12"
            >
              Ver cardapio
            </a>
          </div>
        </div>
      </section>

      {/* Cardapio — fundo cinza claro estilo Sweetgreen */}
      <section id="cardapio" className="bg-gray-100">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {categories.length === 0 && (
            <div className="py-20 text-center text-gray-400">
              <p className="text-lg">Cardapio em breve.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8 md:items-start">
            {/* Coluna esquerda — categorias 1, 3, 5... */}
            <div className="space-y-10">
              {(categories as Category[])
                .filter((_, i) => i % 2 === 0)
                .map((category) => (
                  <div key={category.id}>
                    <h2 className="mb-4 text-lg font-black uppercase tracking-widest text-gray-800">
                      {category.name}
                    </h2>
                    <div className="space-y-3">
                      {category.products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md"
                        >
                          <Link
                            href={"/product/" + product.slug}
                            className="flex-shrink-0"
                          >
                            <div className="h-20 w-20 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-300 text-xs">
                                  Sem foto
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="flex flex-1 min-w-0 flex-col justify-between gap-1">
                            <Link href={"/product/" + product.slug}>
                              <h3 className="font-bold text-gray-900 leading-tight">
                                {product.name}
                              </h3>
                              {product.description && (
                                <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">
                                  {product.description}
                                </p>
                              )}
                            </Link>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-base font-black text-orange-500">
                                R$ {product.price.toFixed(2)}
                              </p>
                              <QuickAddButton product={product} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            {/* Coluna direita — categorias 2, 4, 6... */}
            <div className="space-y-10">
              {(categories as Category[])
                .filter((_, i) => i % 2 !== 0)
                .map((category) => (
                  <div key={category.id}>
                    <h2 className="mb-4 text-lg font-black uppercase tracking-widest text-gray-800">
                      {category.name}
                    </h2>
                    <div className="space-y-3">
                      {category.products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm transition hover:shadow-md"
                        >
                          <Link
                            href={"/product/" + product.slug}
                            className="flex-shrink-0"
                          >
                            <div className="h-20 w-20 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-300 text-xs">
                                  Sem foto
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="flex flex-1 min-w-0 flex-col justify-between gap-1">
                            <Link href={"/product/" + product.slug}>
                              <h3 className="font-bold text-gray-900 leading-tight">
                                {product.name}
                              </h3>
                              {product.description && (
                                <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">
                                  {product.description}
                                </p>
                              )}
                            </Link>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-base font-black text-orange-500">
                                R$ {product.price.toFixed(2)}
                              </p>
                              <QuickAddButton product={product} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-200 px-6 py-6 text-center">
        <p className="text-sm font-bold text-gray-500">{restaurantName}</p>
        <p className="mt-1 text-xs text-gray-400">
          Todos os direitos reservados
        </p>
      </footer>
    </div>
  );
}
