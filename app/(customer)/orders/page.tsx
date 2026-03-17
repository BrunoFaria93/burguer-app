"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher";
import OrderStatusBadge from "@/components/customer/OrderStatusBadge";

type OrderItem = {
  id: string;
  quantity: number;
  product: { name: string };
};

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  address: { street: string; number: string };
};

export default function OrdersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, [session]);

  useEffect(() => {
    if (!orders.length) return;

    const channels = orders
      .filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status))
      .map((order) => {
        const channel = pusherClient.subscribe(`order-${order.id}`);
        channel.bind(
          "order-status-updated",
          (data: { status: string; paymentStatus?: string }) => {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === order.id
                  ? {
                      ...o,
                      status: data.status,
                      paymentStatus: data.paymentStatus ?? o.paymentStatus,
                    }
                  : o,
              ),
            );
          },
        );
        return channel;
      });

    return () => {
      orders.forEach((o) => pusherClient.unsubscribe(`order-${o.id}`));
    };
  }, [orders.length]);

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-black">Faca login para ver seus pedidos</p>
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-8 text-3xl font-black">Meus pedidos</h1>

        {loading && <p className="text-center text-zinc-400">Carregando...</p>}

        {!loading && orders.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-400">Nenhum pedido ainda.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-xl bg-orange-500 px-8 py-3 text-sm font-bold text-white"
            >
              Ver cardapio
            </button>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-sm text-zinc-400">
                  #{order.id.slice(0, 8)}
                </p>
                <OrderStatusBadge
                  status={order.status as import("@prisma/client").OrderStatus}
                />
              </div>

              <div className="space-y-1 mb-4">
                {order.items.map((item) => (
                  <p key={item.id} className="text-sm text-zinc-300">
                    {item.quantity}x {item.product.name}
                  </p>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <p className="text-xs text-zinc-500">
                  {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                </p>
                <p className="font-black text-orange-500">
                  R$ {order.total.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
