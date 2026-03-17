"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

type Extra = { id: string; name: string; price: number };
type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  extras: Extra[];
};

export default function AddToCartButton({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);

  function toggleExtra(extra: Extra) {
    setSelectedExtras((prev) =>
      prev.find((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra],
    );
  }

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const total = (product.price + extrasTotal) * quantity;

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price + extrasTotal,
      imageUrl: product.imageUrl,
      quantity,
      extras: selectedExtras,
    });
    router.push("/cart");
  }

  return (
    <div className="mt-8 space-y-6">
      {product.extras.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold">Adicionais</h2>
          <div className="space-y-2">
            {product.extras.map((extra) => {
              const selected = selectedExtras.find((e) => e.id === extra.id);
              return (
                <button
                  key={extra.id}
                  onClick={() => toggleExtra(extra)}
                  className={
                    "w-full flex items-center justify-between rounded-xl border px-4 py-3 transition " +
                    (selected
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-600")
                  }
                >
                  <span className="text-sm text-zinc-300">{extra.name}</span>
                  <span className="text-sm font-bold text-orange-500">
                    + R$ {extra.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="text-xl font-bold text-zinc-400 hover:text-white"
          >
            -
          </button>
          <span className="w-6 text-center font-bold">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="text-xl font-bold text-zinc-400 hover:text-white"
          >
            +
          </button>
        </div>
        <button
          onClick={handleAdd}
          className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-400"
        >
          Adicionar ao carrinho - R$ {total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
