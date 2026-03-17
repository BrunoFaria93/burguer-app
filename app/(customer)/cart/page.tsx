"use client";

import { useCart } from "@/lib/cart-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const { cart, removeItem, updateQuantity } = useCart();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = 5;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-black">Carrinho vazio</p>
          <p className="mt-2 text-zinc-400">Adicione itens para continuar</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-orange-500 px-8 py-3 text-sm font-bold text-white hover:bg-orange-400"
          >
            Ver cardapio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl font-black sm:text-3xl">Seu carrinho</h1>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">
            Adicionar mais itens
          </Link>
        </div>

        <div className="space-y-4">
          {cart.map((item, index) => (
            <div
              key={index}
              className="flex gap-3 sm:gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{item.name}</p>
                {item.extras.length > 0 && (
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {item.extras.map((e) => e.name).join(", ")}
                  </p>
                )}
                <p className="text-sm text-zinc-400 mt-1">
                  R$ {item.price.toFixed(2)} cada
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                    className="h-7 w-7 rounded-lg border border-zinc-700 bg-zinc-800 text-sm font-bold hover:border-zinc-500 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    className="h-7 w-7 rounded-lg border border-zinc-700 bg-zinc-800 text-sm font-bold hover:border-zinc-500 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                <button
                  onClick={() => removeItem(index)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remover
                </button>
                <p className="font-black text-orange-500 text-sm sm:text-base">
                  R$ {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6 space-y-3">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Taxa de entrega</span>
            <span>R$ {deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-800 pt-3 font-black">
            <span>Total</span>
            <span className="text-orange-500">R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => router.push("/checkout")}
          className="mt-6 w-full rounded-xl bg-orange-500 py-4 text-sm font-bold text-white transition hover:bg-orange-400"
        >
          Finalizar pedido
        </button>
      </div>
    </div>
  );
}
