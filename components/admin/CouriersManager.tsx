"use client";

import { useState } from "react";
import { CourierStatus } from "@prisma/client";
import { Plus, Bike, Package } from "lucide-react";

type Order = {
  id: string;
  status: string;
  total: number;
  address: { street: string; number: string; neighborhood: string };
};

type Courier = {
  id: string;
  status: CourierStatus;
  vehicleType: string;
  licensePlate: string;
  user: { id: string; name: string; email: string };
  orders: Order[];
};

const statusColors: Record<CourierStatus, string> = {
  AVAILABLE: "bg-green-500/20 text-green-500",
  BUSY: "bg-orange-500/20 text-orange-500",
  OFFLINE: "bg-zinc-500/20 text-zinc-400",
};

const statusLabels: Record<CourierStatus, string> = {
  AVAILABLE: "Disponivel",
  BUSY: "Ocupado",
  OFFLINE: "Offline",
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  vehicleType: "",
  licensePlate: "",
};

export default function CouriersManager({
  couriers: initial,
}: {
  couriers: Courier[];
}) {
  const [couriers, setCouriers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedCourier, setExpandedCourier] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError("");

    const userRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: "COURIER",
      }),
    });

    const userData = await userRes.json();
    if (!userRes.ok) {
      setError(userData.error ?? "Erro ao criar usuario");
      setLoading(false);
      return;
    }

    const courierRes = await fetch("/api/couriers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userData.id,
        vehicleType: form.vehicleType,
        licensePlate: form.licensePlate,
      }),
    });

    const courierData = await courierRes.json();
    if (!courierRes.ok) {
      setError(courierData.error ?? "Erro ao criar motoqueiro");
      setLoading(false);
      return;
    }

    setCouriers((prev) => [
      ...prev,
      { ...courierData, user: userData, orders: [] },
    ]);
    setForm(emptyForm);
    setShowForm(false);
    setLoading(false);
  }

  async function updateStatus(courierId: string, status: CourierStatus) {
    await fetch(`/api/couriers/${courierId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setCouriers((prev) =>
      prev.map((c) => (c.id === courierId ? { ...c, status } : c)),
    );
  }

  async function deleteCourier(courierId: string) {
    if (!confirm("Deletar motoqueiro?")) return;
    const res = await fetch(`/api/couriers/${courierId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Erro ao deletar");
      return;
    }
    setCouriers((prev) => prev.filter((c) => c.id !== courierId));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setShowForm(!showForm);
            setError("");
            setForm(emptyForm);
          }}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          <Plus size={16} /> Novo motoqueiro
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold">Novo motoqueiro</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Nome", key: "name", type: "text" },
              { label: "E-mail", key: "email", type: "email" },
              { label: "Senha", key: "password", type: "password" },
              { label: "Telefone", key: "phone", type: "tel" },
              {
                label: "Tipo de veiculo",
                key: "vehicleType",
                type: "text",
                placeholder: "Moto, Bicicleta...",
              },
              { label: "Placa", key: "licensePlate", type: "text" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-sm">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Criar motoqueiro"}
          </button>
        </div>
      )}

      {couriers.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Nenhum motoqueiro cadastrado ainda.
        </div>
      )}

      {couriers.map((courier) => (
        <div
          key={courier.id}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="p-4 sm:px-6 sm:py-4">
            {/* Linha superior: avatar + nome + badge */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                <Bike size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold truncate">{courier.user.name}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[courier.status]}`}
                  >
                    {statusLabels[courier.status]}
                  </span>
                  {courier.orders.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Package size={12} /> {courier.orders.length} pedido(s)
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {courier.user.email} · {courier.vehicleType} ·{" "}
                  {courier.licensePlate}
                </p>
              </div>
            </div>

            {/* Linha de ações */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={courier.status}
                onChange={(e) =>
                  updateStatus(courier.id, e.target.value as CourierStatus)
                }
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
              >
                <option value="AVAILABLE">Disponivel</option>
                <option value="BUSY">Ocupado</option>
                <option value="OFFLINE">Offline</option>
              </select>
              <button
                onClick={() =>
                  setExpandedCourier(
                    expandedCourier === courier.id ? null : courier.id,
                  )
                }
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
              >
                {expandedCourier === courier.id ? "Fechar" : "Ver pedidos"}
              </button>
              <button
                onClick={() => deleteCourier(courier.id)}
                className="rounded-lg px-3 py-1.5 text-xs text-red-500 hover:bg-muted"
              >
                Remover
              </button>
            </div>
          </div>

          {expandedCourier === courier.id && (
            <div className="border-t border-border px-4 py-4 sm:px-6">
              <p className="mb-3 text-sm font-medium">Pedidos em andamento</p>
              {courier.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum pedido ativo.
                </p>
              ) : (
                <div className="space-y-2">
                  {courier.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-2"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-xs font-mono text-muted-foreground">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm truncate">
                          {order.address.street}, {order.address.number} —{" "}
                          {order.address.neighborhood}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-orange-500">
                          R$ {order.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
