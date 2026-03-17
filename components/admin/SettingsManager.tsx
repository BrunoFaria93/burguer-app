"use client";

import { useState } from "react";

type Settings = Record<string, string>;

export default function SettingsManager({
  settings: initial,
}: {
  settings: Settings;
}) {
  const [settings, setSettings] = useState({
    deliveryFee: initial.deliveryFee ?? "5",
    estimatedDeliveryTime: initial.estimatedDeliveryTime ?? "40",
    openingHours: initial.openingHours ?? "18:00 - 23:00",
    restaurantName: initial.restaurantName ?? "",
    restaurantPhone: initial.restaurantPhone ?? "",
    minOrderValue: initial.minOrderValue ?? "0",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setLoading(true);
    setSaved(false);

    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Entrega */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Entrega</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Taxa de entrega (R$)
            </label>
            <input
              type="number"
              value={settings.deliveryFee}
              onChange={(e) =>
                setSettings({ ...settings, deliveryFee: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Tempo estimado de entrega (min)
            </label>
            <input
              type="number"
              value={settings.estimatedDeliveryTime}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  estimatedDeliveryTime: e.target.value,
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Pedido minimo (R$)
            </label>
            <input
              type="number"
              value={settings.minOrderValue}
              onChange={(e) =>
                setSettings({ ...settings, minOrderValue: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Restaurante */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Restaurante</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Nome do restaurante
            </label>
            <input
              type="text"
              value={settings.restaurantName}
              onChange={(e) =>
                setSettings({ ...settings, restaurantName: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Telefone
            </label>
            <input
              type="text"
              value={settings.restaurantPhone}
              onChange={(e) =>
                setSettings({ ...settings, restaurantPhone: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-muted-foreground">
              Horario de funcionamento
            </label>
            <input
              type="text"
              value={settings.openingHours}
              onChange={(e) =>
                setSettings({ ...settings, openingHours: e.target.value })
              }
              placeholder="Ex: Segunda a Sexta 18:00 - 23:00"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-lg bg-orange-500 px-8 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved && <p className="text-sm text-green-500">Salvo com sucesso!</p>}
      </div>
    </div>
  );
}
