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
    <div className="space-y-4">
      {/* Extras */}
      {product.extras.length > 0 && (
        <div className="rounded-3xl bg-white px-6 py-4 shadow-sm">
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-gray-700">
            Adicionais
          </h2>
          <div className="space-y-2">
            {product.extras.map((extra) => {
              const selected = selectedExtras.find((e) => e.id === extra.id);
              return (
                <button
                  key={extra.id}
                  onClick={() => toggleExtra(extra)}
                  className={
                    "w-full flex items-center justify-between rounded-2xl border px-4 py-3 transition " +
                    (selected
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-100 bg-gray-50 hover:border-gray-200")
                  }
                >
                  <span className="text-sm font-medium text-gray-800">
                    {extra.name}
                  </span>
                  <span
                    className={
                      "text-sm font-bold " +
                      (selected ? "text-orange-500" : "text-gray-400")
                    }
                  >
                    + R$ {extra.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantidade e botao */}
      <div className="rounded-3xl bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="text-xl font-bold text-gray-400 hover:text-gray-700 transition"
            >
              -
            </button>
            <span className="w-6 text-center font-black text-gray-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="text-xl font-bold text-gray-400 hover:text-gray-700 transition"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            className="flex-1 rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-400"
          >
            Adicionar ao carrinho - R$ {total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
