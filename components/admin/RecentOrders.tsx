"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher";

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  customer: { name: string };
  items: { id: string }[];
};

const statusLabels: Record<string, string> = {
  PENDING: "Aguardando",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY: "Pronto",
  OUT_FOR_DELIVERY: "Em entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-500",
  CONFIRMED: "bg-blue-500/20 text-blue-500",
  PREPARING: "bg-orange-500/20 text-orange-500",
  READY: "bg-purple-500/20 text-purple-500",
  OUT_FOR_DELIVERY: "bg-cyan-500/20 text-cyan-500",
  DELIVERED: "bg-emerald-500/20 text-emerald-500",
  CANCELLED: "bg-red-500/20 text-red-500",
};

export default function RecentOrders({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);

  useEffect(() => {
    const channel = pusherClient.subscribe("admin-notifications");

    channel.bind("new-notification", () => {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((data) => {
          const mapped = data.slice(0, 10).map((o: Order) => ({
            id: o.id,
            status: o.status,
            total: o.total,
            createdAt: o.createdAt,
            customer: o.customer,
            items: o.items,
          }));
          setOrders(mapped);
        });
    });

    return () => pusherClient.unsubscribe("admin-notifications");
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Pedidos recentes</h2>

      {/* Tabela — só no desktop */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Pedido</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Itens</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum pedido ainda
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-mono text-xs">
                  #{order.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3">
                  {order.customer?.name ?? "Cliente"}
                </td>
                <td className="px-4 py-3">{order.items.length} item(s)</td>
                <td className="px-4 py-3 font-medium">
                  R$ {Number(order.total).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${statusColors[order.status] ?? "bg-gray-500/20 text-gray-500"}`}
                  >
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — só no mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {orders.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhum pedido ainda
          </p>
        )}
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs text-muted-foreground">
                  #{order.id.slice(0, 8)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${statusColors[order.status] ?? "bg-gray-500/20 text-gray-500"}`}
                >
                  {statusLabels[order.status] ?? order.status}
                </span>
              </div>
              <p className="text-sm font-medium truncate">
                {order.customer?.name ?? "Cliente"}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.items.length} item(s)
              </p>
            </div>
            <p className="text-sm font-bold text-orange-500 flex-shrink-0">
              R$ {Number(order.total).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
