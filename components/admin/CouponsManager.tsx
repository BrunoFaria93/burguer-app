"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Product = { id: string; name: string };
type Coupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  active: boolean;
  isLoyaltyReward: boolean;
  freeProduct: { name: string } | null;
};

const emptyForm = {
  code: "",
  discountType: "PERCENT",
  discountValue: "",
  freeProductId: "",
  minOrderValue: "",
  maxUses: "",
  expiresAt: "",
};

export default function CouponsManager({
  coupons: initial,
  products,
}: {
  coupons: Coupon[];
  products: Product[];
}) {
  const [coupons, setCoupons] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"manual" | "loyalty">("manual");

  const manual = coupons.filter((c) => !c.isLoyaltyReward);
  const loyalty = coupons.filter((c) => c.isLoyaltyReward);

  async function handleCreate() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: form.discountValue ? Number(form.discountValue) : 0,
        freeProductId: form.freeProductId || undefined,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao criar cupom");
      setLoading(false);
      return;
    }

    setCoupons((prev) => [data, ...prev]);
    setForm(emptyForm);
    setShowForm(false);
    setLoading(false);
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
  }

  async function handleDelete(id: string) {
    if (!confirm("Deletar cupom?")) return;
    const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Erro ao deletar");
      return;
    }
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }

  function discountLabel(coupon: Coupon) {
    if (coupon.discountType === "PERCENT")
      return `${coupon.discountValue}% off`;
    if (coupon.discountType === "FIXED")
      return `R$ ${coupon.discountValue.toFixed(2)} off`;
    if (coupon.discountType === "FREE_ITEM")
      return `Item gratis: ${coupon.freeProduct?.name ?? ""}`;
    return "";
  }

  function CouponRow({ coupon }: { coupon: Coupon }) {
    return (
      <tr className="border-b border-border last:border-0 hover:bg-muted/30">
        <td className="px-4 py-3">
          <p className="font-mono font-bold tracking-wider">{coupon.code}</p>
          {coupon.isLoyaltyReward && (
            <span className="text-xs text-orange-500">Fidelidade</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm">{discountLabel(coupon)}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {coupon.minOrderValue > 0
            ? `Min R$ ${coupon.minOrderValue.toFixed(2)}`
            : "Sem minimo"}
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {coupon.usedCount}
          {coupon.maxUses ? `/${coupon.maxUses}` : ""} usos
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground">
          {coupon.expiresAt
            ? new Date(coupon.expiresAt).toLocaleDateString("pt-BR")
            : "Sem validade"}
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => toggleActive(coupon.id, !coupon.active)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              coupon.active
                ? "bg-green-500/20 text-green-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {coupon.active ? "Ativo" : "Inativo"}
          </button>
        </td>
        <td className="px-4 py-3">
          {!coupon.isLoyaltyReward && (
            <button
              onClick={() => handleDelete(coupon.id)}
              className="rounded-lg p-1.5 hover:bg-muted text-red-500"
            >
              <Trash2 size={14} />
            </button>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("manual")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "manual"
                ? "bg-orange-500 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Manuais ({manual.length})
          </button>
          <button
            onClick={() => setTab("loyalty")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "loyalty"
                ? "bg-orange-500 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Fidelidade ({loyalty.length})
          </button>
        </div>
        {tab === "manual" && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setForm(emptyForm);
            }}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            <Plus size={16} /> Novo cupom
          </button>
        )}
      </div>

      {showForm && tab === "manual" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Novo cupom</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm">Codigo</label>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="PROMO10"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm uppercase tracking-widest"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Tipo de desconto</label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="PERCENT">Percentual (%)</option>
                <option value="FIXED">Valor fixo (R$)</option>
                <option value="FREE_ITEM">Item gratis</option>
              </select>
            </div>

            {form.discountType !== "FREE_ITEM" && (
              <div>
                <label className="mb-1 block text-sm">
                  {form.discountType === "PERCENT"
                    ? "Percentual (%)"
                    : "Valor (R$)"}
                </label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            )}

            {form.discountType === "FREE_ITEM" && (
              <div>
                <label className="mb-1 block text-sm">Produto gratis</label>
                <select
                  value={form.freeProductId}
                  onChange={(e) =>
                    setForm({ ...form, freeProductId: e.target.value })
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
              <label className="mb-1 block text-sm">Pedido minimo (R$)</label>
              <input
                type="number"
                value={form.minOrderValue}
                onChange={(e) =>
                  setForm({ ...form, minOrderValue: e.target.value })
                }
                placeholder="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Limite de usos</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="Ilimitado"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Validade</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Criar cupom"}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Codigo</th>
              <th className="px-4 py-3 text-left">Desconto</th>
              <th className="px-4 py-3 text-left">Minimo</th>
              <th className="px-4 py-3 text-left">Usos</th>
              <th className="px-4 py-3 text-left">Validade</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {(tab === "manual" ? manual : loyalty).length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum cupom encontrado
                </td>
              </tr>
            )}
            {(tab === "manual" ? manual : loyalty).map((coupon) => (
              <CouponRow key={coupon.id} coupon={coupon} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
