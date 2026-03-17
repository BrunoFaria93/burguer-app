"use client";

import { useState } from "react";
import { OrderStatus } from "@prisma/client";
import { MapPin, Phone, CheckCircle, Bike, Clock } from "lucide-react";

type Order = {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  customer: { name: string; phone: string | null };
  address: {
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
  };
  items?: { product: { name: string }; quantity: number }[];
};

export default function CourierOrders({
  activeOrders,
  deliveredToday,
  courierId,
}: {
  activeOrders: Order[];
  deliveredToday: Order[];
  courierId: string;
}) {
  const [orders, setOrders] = useState(activeOrders);
  const [delivered, setDelivered] = useState(deliveredToday);
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(orderId: string, status: OrderStatus) {
    setLoading(orderId);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Erro ao atualizar pedido");
      setLoading(null);
      return;
    }

    if (status === "DELIVERED") {
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        setDelivered((prev) => [{ ...order, status }, ...prev]);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    }

    setLoading(null);
  }

  const totalRevenue = delivered.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <div className="border-b border-zinc-800/60 bg-zinc-900/50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center gap-4">
          {/* Mobile: discreet grey cards  /  Desktop: inline stats */}
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 sm:flex sm:items-center sm:gap-3">
              <span className="block text-[11px] uppercase tracking-widest text-zinc-500 sm:text-xs">
                Em andamento
              </span>
              <span className="block text-xl font-bold text-zinc-100 sm:text-lg sm:font-semibold">
                {orders.length}
              </span>
            </div>
            <div className="flex-1 sm:flex-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 sm:flex sm:items-center sm:gap-3">
              <span className="block text-[11px] uppercase tracking-widest text-zinc-500 sm:text-xs">
                Entregas hoje
              </span>
              <span className="block text-xl font-bold text-zinc-100 sm:text-lg sm:font-semibold">
                {delivered.length}
              </span>
            </div>
            {delivered.length > 0 && (
              <div className="hidden sm:flex flex-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-zinc-500">
                  Total
                </span>
                <span className="text-lg font-semibold text-emerald-400">
                  R$ {totalRevenue.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────── */}
      <div className="mx-auto  px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 xl:grid-cols-[1fr_420px]">
          {/* ── LEFT / MAIN: Active orders ─────────────────────────── */}
          <section>
            <h2 className="mb-5 flex items-center gap-2.5 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              <Bike size={15} />
              Pedidos ativos
              {orders.length > 0 && (
                <span className="ml-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">
                  {orders.length}
                </span>
              )}
            </h2>

            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 py-20 text-center">
                <Bike size={28} className="text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">
                  Nenhum pedido no momento
                </p>
                <p className="mt-1 text-xs text-zinc-700">
                  Aguarde a atribuição de novos pedidos
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    loading={loading}
                    onUpdateStatus={updateStatus}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── RIGHT / SIDEBAR: Delivered ─────────────────────────── */}
          <section className="mt-10 lg:mt-0">
            <h2 className="mb-5 flex items-center gap-2.5 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              <CheckCircle size={15} />
              Entregues hoje
              {delivered.length > 0 && (
                <>
                  <span className="ml-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">
                    {delivered.length}
                  </span>
                  <span className="ml-auto text-xs font-normal normal-case tracking-normal text-emerald-400">
                    R$ {totalRevenue.toFixed(2)}
                  </span>
                </>
              )}
            </h2>

            {delivered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 py-12 text-center">
                <p className="text-sm text-zinc-600">
                  Nenhuma entrega concluída hoje
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-1">
                {delivered.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-3.5"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <CheckCircle size={14} className="text-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {order.customer.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {order.address.street}, {order.address.number} —{" "}
                        {order.address.neighborhood}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-emerald-400">
                        R$ {order.total.toFixed(2)}
                      </p>
                      <p className="font-mono text-[10px] text-zinc-600">
                        #{order.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ── OrderCard sub-component ──────────────────────────────────────── */
function OrderCard({
  order,
  loading,
  onUpdateStatus,
}: {
  order: Order;
  loading: string | null;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}) {
  const isReady = order.status === "READY";
  const isOutForDelivery = order.status === "OUT_FOR_DELIVERY";

  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden transition-colors hover:border-zinc-700">
      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-800/30 px-5 py-3">
        <span className="font-mono text-[11px] text-zinc-500">
          #{order.id.slice(0, 8)}
        </span>
        <StatusBadge status={order.status} />
      </div>

      <div className="p-5 space-y-4">
        {/* Customer + value */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">
              {order.customer.name}
            </p>
            {order.customer.phone && (
              <a
                href={"tel:" + order.customer.phone}
                className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Phone size={11} />
                {order.customer.phone}
              </a>
            )}
          </div>
          <p className="flex-shrink-0 text-2xl font-black tracking-tight text-white">
            R$ <span className="text-orange-400">{order.total.toFixed(2)}</span>
          </p>
        </div>

        {/* Address */}
        <div className="flex gap-3 rounded-xl bg-zinc-800/60 px-4 py-3">
          <MapPin size={14} className="mt-0.5 flex-shrink-0 text-zinc-400" />
          <div className="text-sm leading-relaxed">
            <p className="font-medium text-zinc-200">
              {order.address.street}, {order.address.number}
              {order.address.complement ? ` — ${order.address.complement}` : ""}
            </p>
            <p className="text-zinc-500">
              {order.address.neighborhood}, {order.address.city}
            </p>
          </div>
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {order.items.map((item, i) => (
              <span
                key={i}
                className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400"
              >
                {item.quantity}× {item.product.name}
              </span>
            ))}
          </div>
        )}

        {/* Action button */}
        {isReady && (
          <button
            onClick={() => onUpdateStatus(order.id, "OUT_FOR_DELIVERY")}
            disabled={loading === order.id}
            className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-400 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Bike size={15} />
            {loading === order.id ? "Atualizando..." : "Sair para entrega"}
          </button>
        )}
        {isOutForDelivery && (
          <button
            onClick={() => onUpdateStatus(order.id, "DELIVERED")}
            disabled={loading === order.id}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle size={15} />
            {loading === order.id ? "Atualizando..." : "Confirmar entrega"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── StatusBadge ──────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: OrderStatus }) {
  if (status === "READY") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Pronto para retirar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
      Em entrega
    </span>
  );
}
