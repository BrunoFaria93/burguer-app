"use client";

import { useCart } from "@/lib/cart-context";

type Extra = { id: string; name: string; price: number };
type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  extras: Extra[];
};

export default function QuickAddButton({ product }: { product: Product }) {
  const { addItem } = useCart();

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!product.extras || product.extras.length > 0) {
      window.location.href = "/product/" + product.slug;
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      extras: [],
    });
  }

  return (
    <button
      onClick={handleAdd}
      className="rounded-lg bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-400 ring-1 ring-orange-500/20 transition hover:bg-orange-500 hover:text-white"
    >
      {!product.extras || product.extras.length > 0
        ? "Personalizar"
        : "Adicionar"}
    </button>
  );
}
