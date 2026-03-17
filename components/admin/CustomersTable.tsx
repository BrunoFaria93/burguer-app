"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type Order = {
  total: number;
  status: string;
  createdAt: Date;
};

type LoyaltyEvent = {
  id: string;
  triggeredAt: Date;
  coupon: { code: string } | null;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  totalCompletedOrders: number;
  loyaltyPoints: number;
  orders: Order[];
  loyaltyEvents: LoyaltyEvent[];
};

export default function CustomersTable({
  customers,
}: {
  customers: Customer[];
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Buscar por nome ou e-mail..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Pedidos</th>
              <th className="px-4 py-3 text-left">Total gasto</th>
              <th className="px-4 py-3 text-left">Membro desde</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum cliente encontrado
                </td>
              </tr>
            )}
            {filtered.map((customer) => {
              const totalSpent = customer.orders.reduce(
                (sum, o) => sum + o.total,
                0,
              );
              const isExpanded = expanded === customer.id;

              return (
                <>
                  <tr
                    key={customer.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.email}
                      </p>
                      {customer.phone && (
                        <p className="text-xs text-muted-foreground">
                          {customer.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p>{customer.totalCompletedOrders} concluido(s)</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.orders.length} pago(s)
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium text-orange-500">
                      R$ {totalSpent.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          setExpanded(isExpanded ? null : customer.id)
                        }
                        className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )}
                        Detalhes
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr
                      key={customer.id + "-expanded"}
                      className="border-b border-border bg-muted/10"
                    >
                      <td colSpan={5} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Ultimos pedidos
                            </p>
                            {customer.orders.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Nenhum pedido
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {customer.orders.slice(0, 5).map((order, i) => (
                                  <div
                                    key={i}
                                    className="flex justify-between text-xs"
                                  >
                                    <span className="text-muted-foreground">
                                      {new Date(
                                        order.createdAt,
                                      ).toLocaleDateString("pt-BR")}
                                    </span>
                                    <span className="font-medium">
                                      R$ {order.total.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Recompensas recebidas
                            </p>
                            {customer.loyaltyEvents.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Nenhuma recompensa ainda
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {customer.loyaltyEvents
                                  .slice(0, 5)
                                  .map((event) => (
                                    <div
                                      key={event.id}
                                      className="flex justify-between text-xs"
                                    >
                                      <span className="text-muted-foreground">
                                        {new Date(
                                          event.triggeredAt,
                                        ).toLocaleDateString("pt-BR")}
                                      </span>
                                      <span className="font-mono text-orange-500">
                                        {event.coupon?.code ?? "sem cupom"}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
