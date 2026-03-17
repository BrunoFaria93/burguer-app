"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";

type Extra = { id: string; name: string; price: number };
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  active: boolean;
  preparationTime: number;
  extras: Extra[];
};
type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  active: boolean;
  position: number;
  products: Product[];
};

const emptyProduct = {
  name: "",
  slug: "",
  description: "",
  price: "",
  imageUrl: "",
  preparationTime: "30",
  active: true,
};

const emptyCategory = {
  name: "",
  slug: "",
  imageUrl: "",
  active: true,
  position: "0",
};

const emptyExtra = { name: "", price: "" };

export default function MenuManager({
  categories: initial,
}: {
  categories: Category[];
}) {
  const [categories, setCategories] = useState(initial);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const [showProductForm, setShowProductForm] = useState<string | null>(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  const [extraForm, setExtraForm] = useState(emptyExtra);
  const [showExtraForm, setShowExtraForm] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  async function saveCategory() {
    setLoading(true);
    const url = editingCategory
      ? `/api/categories/${editingCategory}`
      : "/api/categories";
    const method = editingCategory ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...categoryForm,
        position: Number(categoryForm.position),
      }),
    });
    const data = await res.json();

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory ? { ...c, ...data } : c)),
      );
    } else {
      setCategories((prev) => [...prev, { ...data, products: [] }]);
    }

    setCategoryForm(emptyCategory);
    setShowCategoryForm(false);
    setEditingCategory(null);
    setLoading(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Deletar categoria e todos os produtos?")) return;

    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json();
      alert(
        data.error ??
          "Erro ao deletar categoria. Verifique se nao ha pedidos vinculados aos produtos.",
      );
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function startEditCategory(cat: Category) {
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      imageUrl: cat.imageUrl ?? "",
      active: cat.active,
      position: String(cat.position),
    });
    setEditingCategory(cat.id);
    setShowCategoryForm(true);
  }

  async function saveProduct(categoryId: string) {
    setLoading(true);
    const url = editingProduct
      ? `/api/products/${editingProduct}`
      : "/api/products";
    const method = editingProduct ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...productForm,
        categoryId,
        price: Number(productForm.price),
        preparationTime: Number(productForm.preparationTime),
      }),
    });
    const data = await res.json();

    if (editingProduct) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                products: c.products.map((p) =>
                  p.id === editingProduct
                    ? {
                        ...p,
                        ...data,
                        price: Number(data.price),
                        preparationTime: Number(data.preparationTime),
                      }
                    : p,
                ),
              }
            : c,
        ),
      );
    } else {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                products: [
                  ...c.products,
                  {
                    ...data,
                    price: Number(data.price),
                    preparationTime: Number(data.preparationTime),
                    extras: [],
                  },
                ],
              }
            : c,
        ),
      );
    }

    setProductForm(emptyProduct);
    setShowProductForm(null);
    setEditingProduct(null);
    setLoading(false);
  }

  async function deleteProduct(categoryId: string, productId: string) {
    if (!confirm("Deletar produto?")) return;

    const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json();
      alert(
        data.error ??
          "Erro ao deletar produto. Verifique se nao ha pedidos vinculados a ele.",
      );
      return;
    }

    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, products: c.products.filter((p) => p.id !== productId) }
          : c,
      ),
    );
  }

  function startEditProduct(cat: Category, product: Product) {
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: String(product.price),
      imageUrl: product.imageUrl ?? "",
      preparationTime: String(product.preparationTime),
      active: product.active,
    });
    setEditingProduct(product.id);
    setShowProductForm(cat.id);
  }

  async function saveExtra(productId: string, categoryId: string) {
    setLoading(true);
    const res = await fetch(`/api/products/${productId}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: extraForm.name,
        price: Number(extraForm.price),
      }),
    });
    const data = await res.json();

    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              products: c.products.map((p) =>
                p.id === productId ? { ...p, extras: [...p.extras, data] } : p,
              ),
            }
          : c,
      ),
    );

    setExtraForm(emptyExtra);
    setShowExtraForm(null);
    setLoading(false);
  }

  async function deleteExtra(
    productId: string,
    categoryId: string,
    extraId: string,
  ) {
    await fetch(`/api/products/${productId}/extras`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extraId }),
    });
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              products: c.products.map((p) =>
                p.id === productId
                  ? { ...p, extras: p.extras.filter((e) => e.id !== extraId) }
                  : p,
              ),
            }
          : c,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setShowCategoryForm(!showCategoryForm);
            setEditingCategory(null);
            setCategoryForm(emptyCategory);
          }}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          <Plus size={16} /> Nova categoria
        </button>
      </div>

      {showCategoryForm && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold">
            {editingCategory ? "Editar categoria" : "Nova categoria"}
          </h3>
          {/* mobile: 1 col / desktop: 2 col */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Nome", key: "name", type: "text" },
              { label: "Slug", key: "slug", type: "text" },
              { label: "URL da imagem", key: "imageUrl", type: "text" },
              { label: "Posição", key: "position", type: "number" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="mb-1 block text-sm">{label}</label>
                <input
                  type={type}
                  value={
                    categoryForm[key as keyof typeof categoryForm] as string
                  }
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, [key]: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={categoryForm.active}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, active: e.target.checked })
                }
                id="cat-active"
              />
              <label htmlFor="cat-active" className="text-sm">
                Ativa
              </label>
            </div>
          </div>
          <button
            onClick={saveCategory}
            disabled={loading}
            className="rounded-lg bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      )}

      {categories.map((cat) => (
        <div
          key={cat.id}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-muted/30">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === cat.id ? null : cat.id,
                  )
                }
                className="flex-shrink-0"
              >
                {expandedCategory === cat.id ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>
              <div className="min-w-0">
                <p className="font-semibold truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {cat.products.length} produto(s)
                </p>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs ${cat.active ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}
              >
                {cat.active ? "Ativa" : "Inativa"}
              </span>
            </div>
            <div className="flex gap-1 flex-shrink-0 ml-2">
              <button
                onClick={() => startEditCategory(cat)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="rounded-lg p-2 hover:bg-muted text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {expandedCategory === cat.id && (
            <div className="p-4 space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowProductForm(cat.id);
                    setEditingProduct(null);
                    setProductForm(emptyProduct);
                  }}
                  className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80"
                >
                  <Plus size={12} /> Novo produto
                </button>
              </div>

              {showProductForm === cat.id && (
                <div className="rounded-xl border border-border p-4 space-y-4">
                  <h4 className="font-medium text-sm">
                    {editingProduct ? "Editar produto" : "Novo produto"}
                  </h4>
                  {/* mobile: 1 col / desktop: 2 col */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { label: "Nome", key: "name", type: "text" },
                      { label: "Slug", key: "slug", type: "text" },
                      { label: "Preço (R$)", key: "price", type: "number" },
                      {
                        label: "Tempo de preparo (min)",
                        key: "preparationTime",
                        type: "number",
                      },
                      { label: "URL da imagem", key: "imageUrl", type: "text" },
                    ].map(({ label, key, type }) => (
                      <div key={key}>
                        <label className="mb-1 block text-xs">{label}</label>
                        <input
                          type={type}
                          value={
                            productForm[
                              key as keyof typeof productForm
                            ] as string
                          }
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              [key]: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs">Descrição</label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={productForm.active}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            active: e.target.checked,
                          })
                        }
                        id={`prod-active-${cat.id}`}
                      />
                      <label
                        htmlFor={`prod-active-${cat.id}`}
                        className="text-sm"
                      >
                        Ativo
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => saveProduct(cat.id)}
                    disabled={loading}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {loading ? "Salvando..." : "Salvar produto"}
                  </button>
                </div>
              )}

              {cat.products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg border border-border overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-muted/20">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        className="flex-shrink-0"
                        onClick={() =>
                          setExpandedProduct(
                            expandedProduct === product.id ? null : product.id,
                          )
                        }
                      >
                        {expandedProduct === product.id ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          R$ {Number(product.price).toFixed(2)} ·{" "}
                          {product.preparationTime} min ·{" "}
                          {product.extras.length} extra(s)
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs ${product.active ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}
                      >
                        {product.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => startEditProduct(cat, product)}
                        className="rounded-lg p-1.5 hover:bg-muted"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteProduct(cat.id, product.id)}
                        className="rounded-lg p-1.5 hover:bg-muted text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {expandedProduct === product.id && (
                    <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/10">
                      <p className="text-xs font-medium text-muted-foreground">
                        Extras
                      </p>
                      {product.extras.map((extra) => (
                        <div
                          key={extra.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>
                            {extra.name} — R$ {Number(extra.price).toFixed(2)}
                          </span>
                          <button
                            onClick={() =>
                              deleteExtra(product.id, cat.id, extra.id)
                            }
                            className="text-red-500 hover:underline text-xs"
                          >
                            Remover
                          </button>
                        </div>
                      ))}

                      {showExtraForm === product.id ? (
                        // mobile: empilhado / desktop: linha
                        <div className="flex flex-col gap-2 mt-2 sm:flex-row">
                          <input
                            placeholder="Nome do extra"
                            value={extraForm.name}
                            onChange={(e) =>
                              setExtraForm({
                                ...extraForm,
                                name: e.target.value,
                              })
                            }
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                          />
                          <input
                            placeholder="Preço"
                            type="number"
                            value={extraForm.price}
                            onChange={(e) =>
                              setExtraForm({
                                ...extraForm,
                                price: e.target.value,
                              })
                            }
                            className="sm:w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveExtra(product.id, cat.id)}
                              disabled={loading}
                              className="flex-1 sm:flex-none rounded-lg bg-orange-500 px-3 py-1.5 text-xs text-white hover:bg-orange-600"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setShowExtraForm(null)}
                              className="flex-1 sm:flex-none rounded-lg bg-muted px-3 py-1.5 text-xs hover:bg-muted/80"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowExtraForm(product.id)}
                          className="flex items-center gap-1 text-xs text-orange-500 hover:underline mt-1"
                        >
                          <Plus size={12} /> Adicionar extra
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {categories.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Nenhuma categoria ainda. Crie uma para começar!
        </div>
      )}
    </div>
  );
}
