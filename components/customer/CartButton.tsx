"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CartButton() {
  const { cart } = useCart();
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <style>{`
        @keyframes cart-bounce {
          0% { transform: scale(1); }
          40% { transform: scale(1.25); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes badge-pop {
          0% { transform: scale(0); }
          60% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .cart-btn { animation: cart-bounce 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .badge-pop { animation: badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>
      <Link
        href="/cart"
        key={total}
        className="cart-btn relative flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
      >
        <ShoppingCart size={16} />
        Carrinho
        {total > 0 && (
          <span
            key={total}
            className="badge-pop absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-orange-500"
          >
            {total > 99 ? "99+" : total}
          </span>
        )}
      </Link>
    </>
  );
}
