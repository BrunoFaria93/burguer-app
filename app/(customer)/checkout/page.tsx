"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeCheckoutForm from "@/components/customer/StripeCheckoutForm";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type Address = {
  id: string;
  label: string;
  street: string;
  number: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { cart, clearItems } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("lastAddressId") ?? "";
  });
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [notes, setNotes] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"summary" | "payment">("summary");

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/addresses")
        .then((r) => r.json())
        .then((data) => {
          setAddresses(data);
          const lastUsed = localStorage.getItem("lastAddressId");
          const exists = data.find((a: { id: string }) => a.id === lastUsed);
          if (!exists && data.length > 0) {
            setSelectedAddress(data[data.length - 1].id);
          }
        });
    }
  }, [session?.user?.id]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = 5;
  const total = subtotal - couponDiscount + deliveryFee;

  async function validateCoupon() {
    setCouponError("");
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCouponError(data.error);
      setCouponDiscount(0);
      return;
    }
    if (data.discountType === "PERCENT") {
      setCouponDiscount(subtotal * (data.discountValue / 100));
    } else if (data.discountType === "FIXED") {
      setCouponDiscount(data.discountValue);
    }
  }

  async function handleProceedToPayment() {
    if (!selectedAddress) {
      alert("Selecione um endereco de entrega");
      return;
    }
    setLoading(true);
    localStorage.setItem("lastAddressId", selectedAddress);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressId: selectedAddress,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          extras: item.extras,
        })),
        couponCode: couponCode || undefined,
        notes,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      setLoading(false);
      return;
    }

    setClientSecret(data.clientSecret);
    setOrderId(data.order.id);
    setStep("payment");
    setLoading(false);
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-black">Faca login para continuar</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-xl bg-orange-500 px-8 py-3 text-sm font-bold text-white"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  if (step === "payment" && clientSecret) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 space-y-8">
          <button
            onClick={() => setStep("summary")}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-black sm:text-3xl">Pagamento</h1>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
            <p className="mb-6 text-sm text-zinc-400">
              Total a pagar:{" "}
              <span className="text-xl font-black text-orange-500">
                R$ {total.toFixed(2)}
              </span>
            </p>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#f97316",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <StripeCheckoutForm
                orderId={orderId}
                onSuccess={() => {
                  clearItems();
                  router.push("/orders");
                }}
              />
            </Elements>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 space-y-6 sm:space-y-8">
        <h1 className="text-2xl font-black sm:text-3xl">Finalizar pedido</h1>

        {/* Resumo */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6 space-y-2">
          <h2 className="font-bold mb-4">Resumo</h2>
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-zinc-400">
              <span className="truncate mr-3">
                {item.quantity}x {item.name}
              </span>
              <span className="flex-shrink-0">
                R$ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Endereço */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <h2 className="font-bold mb-4">Endereco de entrega</h2>
          {addresses.length === 0 ? (
            <div>
              <p className="text-sm text-zinc-400 mb-3">
                Nenhum endereco cadastrado.
              </p>
              <button
                onClick={() => router.push("/account?from=checkout")}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500"
              >
                Cadastrar endereco
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr.id)}
                  className={
                    "w-full text-left rounded-xl border px-4 py-3 text-sm transition " +
                    (selectedAddress === addr.id
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-700 hover:border-zinc-500")
                  }
                >
                  <p className="font-medium">{addr.label}</p>
                  <p className="text-zinc-400">
                    {addr.street}, {addr.number}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cupom */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <h2 className="font-bold mb-4">Cupom de desconto</h2>
          <div className="flex gap-2 sm:gap-3">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="CODIGO"
              className="flex-1 min-w-0 rounded-xl border border-zinc-700 bg-zinc-800 px-3 sm:px-4 py-2 text-sm uppercase tracking-widest focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={validateCoupon}
              className="flex-shrink-0 rounded-xl bg-zinc-700 px-3 sm:px-4 py-2 text-sm font-bold hover:bg-zinc-600"
            >
              Aplicar
            </button>
          </div>
          {couponError && (
            <p className="mt-2 text-xs text-red-500">{couponError}</p>
          )}
          {couponDiscount > 0 && (
            <p className="mt-2 text-xs text-green-500">
              Desconto de R$ {couponDiscount.toFixed(2)} aplicado!
            </p>
          )}
        </div>

        {/* Observações */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <h2 className="font-bold mb-4">Observacoes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: sem cebola, ponto da carne..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
            rows={3}
          />
        </div>

        {/* Totais */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6 space-y-3">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-500">
              <span>Desconto</span>
              <span>- R$ {couponDiscount.toFixed(2)}</span>
            </div>
          )}
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
          onClick={handleProceedToPayment}
          disabled={loading}
          className="w-full rounded-xl bg-orange-500 py-4 text-sm font-bold text-white transition hover:bg-orange-400 disabled:opacity-50"
        >
          {loading ? "Processando..." : "Ir para pagamento"}
        </button>
      </div>
    </div>
  );
}
