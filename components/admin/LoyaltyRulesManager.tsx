"use client";

import { useState } from "react";
import { MetricType, RewardType } from "@prisma/client";

type Rule = {
  id: string;
  name: string;
  active: boolean;
  metricType: MetricType;
  metricValue: number;
  periodDays: number | null;
  rewardType: RewardType;
  rewardValue: number | null;
  rewardProduct: { name: string } | null;
  couponPrefix: string;
  couponExpiryDays: number;
};

type Product = { id: string; name: string };
type Event = {
  id: string;
  triggeredAt: Date;
  user: { name: string; email: string };
  rule: { name: string };
  coupon: { code: string } | null;
};

const metricLabels: Record<MetricType, string> = {
  ORDER_COUNT: "Quantidade de pedidos",
  TOTAL_SPENT: "Total gasto (R$)",
  ORDERS_IN_PERIOD: "Pedidos em X dias",
};

const rewardLabels: Record<RewardType, string> = {
  DISCOUNT_PERCENT: "Desconto %",
  DISCOUNT_FIXED: "Desconto fixo R$",
  FREE_ITEM: "Item grátis",
};

const emptyForm = {
  name: "",
  metricType: "ORDER_COUNT" as MetricType,
  metricValue: 5,
  periodDays: "",
  rewardType: "DISCOUNT_PERCENT" as RewardType,
  rewardValue: "",
  rewardProductId: "",
  couponPrefix: "FIEL",
  couponExpiryDays: 30,
};

export default function LoyaltyRulesManager({
  rules: initialRules,
  products,
  events,
}: {
  rules: Rule[];
  products: Product[];
  events: Event[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    const res = await fetch("/api/loyalty/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        metricValue: Number(form.metricValue),
        periodDays: form.periodDays ? Number(form.periodDays) : undefined,
        rewardValue: form.rewardValue ? Number(form.rewardValue) : undefined,
        rewardProductId: form.rewardProductId || undefined,
      }),
    });
    const rule = await res.json();
    setRules((prev) => [rule, ...prev]);
    setForm(emptyForm);
    setShowForm(false);
    setLoading(false);
  }

  async function toggleRule(id: string, active: boolean) {
    await fetch(`/api/loyalty/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active } : r)));
  }

  return (
    <div className="space-y-8">
      {/* Regras */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Regras ativas</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            + Nova regra
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Nova regra de fidelidade</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm">Nome da regra</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="ex: Comprou 5x — 10% off"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Métrica</label>
                <select
                  value={form.metricType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      metricType: e.target.value as MetricType,
                    })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(metricLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">
                  {form.metricType === "TOTAL_SPENT"
                    ? "Valor (R$)"
                    : "Quantidade"}
                </label>
                <input
                  type="number"
                  value={form.metricValue}
                  onChange={(e) =>
                    setForm({ ...form, metricValue: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              {form.metricType === "ORDERS_IN_PERIOD" && (
                <div>
                  <label className="mb-1 block text-sm">Período (dias)</label>
                  <input
                    type="number"
                    value={form.periodDays}
                    onChange={(e) =>
                      setForm({ ...form, periodDays: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm">Recompensa</label>
                <select
                  value={form.rewardType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      rewardType: e.target.value as RewardType,
                    })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(rewardLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              {form.rewardType !== "FREE_ITEM" && (
                <div>
                  <label className="mb-1 block text-sm">
                    {form.rewardType === "DISCOUNT_PERCENT"
                      ? "Percentual (%)"
                      : "Valor (R$)"}
                  </label>
                  <input
                    type="number"
                    value={form.rewardValue}
                    onChange={(e) =>
                      setForm({ ...form, rewardValue: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
              {form.rewardType === "FREE_ITEM" && (
                <div>
                  <label className="mb-1 block text-sm">Produto grátis</label>
                  <select
                    value={form.rewardProductId}
                    onChange={(e) =>
                      setForm({ ...form, rewardProductId: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm">Prefixo do cupom</label>
                <input
                  value={form.couponPrefix}
                  onChange={(e) =>
                    setForm({ ...form, couponPrefix: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">
                  Validade do cupom (dias)
                </label>
                <input
                  type="number"
                  value={form.couponExpiryDays}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      couponExpiryDays: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar regra"}
            </button>
          </div>
        )}

        {rules.map((rule) => (
          <div
            key={rule.id}
            className="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{rule.name}</p>
              <p className="text-sm text-muted-foreground">
                {metricLabels[rule.metricType]}: {rule.metricValue}
                {rule.periodDays ? ` em ${rule.periodDays} dias` : ""}
                {" → "}
                {rewardLabels[rule.rewardType]}
                {rule.rewardValue ? `: ${rule.rewardValue}` : ""}
                {rule.rewardProduct ? `: ${rule.rewardProduct.name}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cupom: {rule.couponPrefix}-XXXXX · Validade:{" "}
                {rule.couponExpiryDays} dias
              </p>
            </div>
            <button
              onClick={() => toggleRule(rule.id, !rule.active)}
              className={`rounded-full px-4 py-1 text-xs font-medium ${
                rule.active
                  ? "bg-green-500/20 text-green-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {rule.active ? "Ativa" : "Inativa"}
            </button>
          </div>
        ))}
      </div>

      {/* Histórico */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Histórico de recompensas</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Regra</th>
                <th className="px-4 py-3 text-left">Cupom</th>
                <th className="px-4 py-3 text-left">Data</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <p>{e.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.user.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">{e.rule.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-orange-500">
                    {e.coupon?.code ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(e.triggeredAt).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
