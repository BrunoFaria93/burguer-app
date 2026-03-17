"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Plus, Trash2, MapPin, LogOut, ArrowLeft } from "lucide-react";

type Address = {
  id: string;
  label: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalCompletedOrders: number;
  addresses: Address[];
};

const emptyForm = {
  label: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
};

// ── Máscaras ──────────────────────────────────────────────────────────
function maskCep(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

function maskState(value: string) {
  return value
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 2);
}

export default function AccountManager({
  user,
  fromCheckout = false,
}: {
  user: User;
  fromCheckout?: boolean;
}) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(user.addresses);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(key: string, raw: string) {
    let value = raw;
    if (key === "zipCode") value = maskCep(raw);
    if (key === "state") value = maskState(raw);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAddAddress() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar endereco");
      setLoading(false);
      return;
    }

    setAddresses((prev) => [...prev, data]);
    setForm(emptyForm);
    setShowForm(false);
    setLoading(false);
  }

  async function handleDeleteAddress(id: string) {
    if (!confirm("Remover endereco?")) return;
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Erro ao remover");
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  const fields = [
    {
      label: "Identificacao",
      key: "label",
      placeholder: "Casa, Trabalho...",
      inputMode: "text",
    },
    {
      label: "CEP",
      key: "zipCode",
      placeholder: "00000-000",
      inputMode: "numeric",
    },
    {
      label: "Rua",
      key: "street",
      placeholder: "Nome da rua",
      inputMode: "text",
    },
    {
      label: "Numero",
      key: "number",
      placeholder: "123",
      inputMode: "numeric",
    },
    {
      label: "Complemento",
      key: "complement",
      placeholder: "Apto, Bloco...",
      inputMode: "text",
    },
    {
      label: "Bairro",
      key: "neighborhood",
      placeholder: "Nome do bairro",
      inputMode: "text",
    },
    {
      label: "Cidade",
      key: "city",
      placeholder: "Sua cidade",
      inputMode: "text",
    },
    { label: "Estado", key: "state", placeholder: "SP", inputMode: "text" },
  ] as const;

  return (
    <div className="space-y-6 sm:space-y-8">
      {fromCheckout && (
        <button
          onClick={() => router.push("/checkout")}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft size={16} /> Voltar para o checkout
        </button>
      )}

      {/* Dados do usuário */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
        <h2 className="mb-4 font-bold">Seus dados</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400 flex-shrink-0">Nome</span>
            <span className="text-right truncate">{user.name}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400 flex-shrink-0">E-mail</span>
            <span className="text-right truncate">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400 flex-shrink-0">Telefone</span>
              <span className="text-right">{user.phone}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-zinc-400 flex-shrink-0">
              Pedidos concluidos
            </span>
            <span className="font-bold text-orange-500">
              {user.totalCompletedOrders}
            </span>
          </div>
        </div>
      </div>

      {/* Endereços */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Meus enderecos</h2>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setForm(emptyForm);
            }}
            className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {showForm && (
          <div className="rounded-xl border border-zinc-700 p-4 space-y-3">
            {/* mobile: 1 col / desktop: 2 col */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map(({ label, key, placeholder, inputMode }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-zinc-400">
                    {label}
                  </label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    inputMode={
                      inputMode as React.HTMLAttributes<HTMLInputElement>["inputMode"]
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              ))}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleAddAddress}
              disabled={loading}
              className="w-full sm:w-auto rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar endereco"}
            </button>
          </div>
        )}

        {addresses.length === 0 && !showForm && (
          <p className="text-sm text-zinc-500">
            Nenhum endereco cadastrado ainda.
          </p>
        )}

        <div className="space-y-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex items-start justify-between rounded-xl border border-zinc-700 p-3 sm:p-4"
            >
              <div className="flex gap-3 min-w-0">
                <MapPin
                  size={16}
                  className="mt-0.5 text-orange-500 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{addr.label}</p>
                  <p className="text-xs text-zinc-400 truncate">
                    {addr.street}, {addr.number}
                    {addr.complement ? ` — ${addr.complement}` : ""}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {addr.neighborhood}, {addr.city} — {addr.state}
                  </p>
                  <p className="text-xs text-zinc-500">{addr.zipCode}</p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteAddress(addr.id)}
                className="flex-shrink-0 ml-2 rounded-lg p-1.5 hover:bg-zinc-800 text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 py-4 text-sm text-zinc-400 hover:border-red-500/50 hover:text-red-500 transition"
      >
        <LogOut size={16} /> Sair da conta
      </button>
    </div>
  );
}
