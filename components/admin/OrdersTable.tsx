"use client";

import { useState } from "react";
type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";
type Order = {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  customer: { name: string };
  courier: { id: string; user: { name: string } } | null;
  items: { product: { name: string }; quantity: number }[];
  address: { street: string; number: string; neighborhood: string };
};

type Courier = {
  id: string;
  user: { name: string };
};

const statusOptions: OrderStatus[] = [
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Aguardando",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Em entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export default function OrdersTable({
  orders,
  couriers,
}: {
  orders: Order[];
  couriers: Courier[];
}) {
  const [data, setData] = useState(orders);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");

  async function updateStatus(
    orderId: string,
    status: OrderStatus,
    courierId?: string,
  ) {
    await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, courierId }),
    });
    setData((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              courier: courierId
                ? (couriers.find((c) => c.id === courierId) ?? null)
                : o.courier,
            }
          : o,
      ),
    );
  }

  const filtered =
    filter === "ALL" ? data : data.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("ALL")}
          className={`rounded-full px-3 py-1 text-xs ${filter === "ALL" ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"}`}
        >
          Todos
        </button>
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs ${filter === s ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"}`}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Tabela — só no desktop */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Pedido</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Endereço</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Motoqueiro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr
                key={order.id}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-mono text-xs">
                  #{order.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3">{order.customer.name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {order.address.street}, {order.address.number}
                </td>
                <td className="px-4 py-3 font-medium">
                  R$ {order.total.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateStatus(order.id, e.target.value as OrderStatus)
                    }
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {statusLabels[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.courier?.id ?? ""}
                    onChange={(e) =>
                      updateStatus(order.id, order.status, e.target.value)
                    }
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="">Sem motoqueiro</option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.user.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — só no mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhum pedido encontrado.
          </p>
        )}
        {filtered.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            {/* Cabeçalho do card */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                #{order.id.slice(0, 8)}
              </span>
              <span className="text-sm font-bold text-orange-500">
                R$ {order.total.toFixed(2)}
              </span>
            </div>

            {/* Cliente e endereço */}
            <div>
              <p className="text-sm font-medium">{order.customer.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.address.street}, {order.address.number} —{" "}
                {order.address.neighborhood}
              </p>
            </div>

            {/* Itens */}
            {order.items.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {order.items.map((item, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {item.quantity}× {item.product.name}
                  </span>
                ))}
              </div>
            )}

            {/* Selects */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] text-muted-foreground">
                  Status
                </label>
                <select
                  value={order.status}
                  onChange={(e) =>
                    updateStatus(order.id, e.target.value as OrderStatus)
                  }
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {statusLabels[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-muted-foreground">
                  Motoqueiro
                </label>
                <select
                  value={order.courier?.id ?? ""}
                  onChange={(e) =>
                    updateStatus(order.id, order.status, e.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                >
                  <option value="">Sem moto</option>
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
