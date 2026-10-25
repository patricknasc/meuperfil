"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { storeTranslator } from "@/lib/i18n/store";
import { formatPrice } from "@/lib/store/money";
import type { AdminCategory, AdminProduct, AdminStoreData } from "@/components/store/admin-types";

export default function StoreProductsPage() {
  const { lang } = useParams<{ lang: string }>();
  const t = storeTranslator(lang);

  const [data, setData] = useState<AdminStoreData | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");

  const loadProducts = useCallback(async (searchTerm: string, categoryId: string) => {
    const qs = new URLSearchParams();
    if (searchTerm) qs.set("search", searchTerm);
    if (categoryId) qs.set("categoryId", categoryId);
    const res = await fetch(`/api/store/products?${qs}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setProducts(json.data.products);
  }, []);

  const loadStore = useCallback(async () => {
    const res = await fetch("/api/store");
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setData(json.data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("/api/store").then((r) => r.json()), fetch("/api/store/products").then((r) => r.json())])
      .then(([storeJson, productsJson]) => {
        if (cancelled) return;
        if (!storeJson.success || !productsJson.success) throw new Error();
        setData(storeJson.data);
        setProducts(productsJson.data.products);
      })
      .catch(() => !cancelled && setError(t("Não foi possível carregar a loja.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function addCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!newCategory.trim()) return;
    const res = await fetch("/api/store/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });
    const json = await res.json();
    if (!json.success) return setError(json.error);
    setNewCategory("");
    await loadStore();
  }

  async function renameCategory(category: AdminCategory) {
    const name = window.prompt(t("Novo nome da categoria"), category.name)?.trim();
    if (!name || name === category.name) return;
    const res = await fetch(`/api/store/categories/${category.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!json.success) return setError(json.error);
    await loadStore();
  }

  async function removeCategory(category: AdminCategory) {
    if (!window.confirm(t("Excluir a categoria? Os produtos dela ficam sem categoria."))) return;
    const res = await fetch(`/api/store/categories/${category.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) return setError(json.error);
    if (categoryFilter === category.id) setCategoryFilter("");
    await Promise.all([loadStore(), loadProducts(search, categoryFilter === category.id ? "" : categoryFilter)]);
  }

  const publicHandle = data?.profiles.find((p) => p.isPublished)?.handle;
  const limit = data?.limits;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-muted">
          {t("Cadastre produtos, serviços e itens digitais. Eles aparecem na loja do seu perfil e no bloco de galeria do link na bio.")}
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          {publicHandle && (
            <a
              href={`/${lang}/${publicHandle}/loja`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-border-hover"
            >
              {t("Ver loja")}
            </a>
          )}
          <Link
            href={`/${lang}/store/products/new`}
            aria-disabled={limit ? !limit.allowed : undefined}
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover ${
              limit && !limit.allowed ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("Novo produto")}
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error">
          {error}
        </div>
      )}

      {limit && limit.limit !== null && (
        <p className="text-xs text-muted">
          {limit.currentCount} / {limit.limit} {t("produtos do seu plano")}
          {!limit.allowed && ` · ${t("Faça upgrade para cadastrar mais.")}`}
        </p>
      )}

      {!publicHandle && !loading && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-foreground">
          {t("Publique um perfil no Link na bio para a loja ficar visível.")}{" "}
          <Link href={`/${lang}/profiles`} className="font-semibold text-accent underline">
            {t("Ir para Link na bio")}
          </Link>
        </div>
      )}

      <section className="glass space-y-3 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-foreground">{t("Categorias")}</h2>
        <div className="flex flex-wrap gap-2">
          {data?.categories.map((category) => (
            <span key={category.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface py-1 pl-3 pr-1 text-xs">
              <button type="button" onClick={() => void renameCategory(category)} className="font-medium text-foreground hover:underline">
                {category.name}
              </button>
              <span className="text-muted">({category._count?.products ?? 0})</span>
              <button
                type="button"
                onClick={() => void removeCategory(category)}
                aria-label={`${t("Excluir")} ${category.name}`}
                className="rounded-full px-1.5 text-muted hover:bg-surface-hover hover:text-error"
              >
                ×
              </button>
            </span>
          ))}
          <form onSubmit={addCategory} className="flex items-center gap-1">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={t("Nova categoria")}
              aria-label={t("Nova categoria")}
              maxLength={60}
              className="w-36 rounded-full border border-border bg-surface px-3 py-1 text-xs"
            />
            <button type="submit" className="rounded-full bg-surface-hover px-3 py-1 text-xs font-semibold text-foreground">
              {t("Adicionar")}
            </button>
          </form>
        </div>
      </section>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void loadProducts(search, categoryFilter);
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Buscar por nome ou SKU")}
          aria-label={t("Buscar por nome ou SKU")}
          className="min-w-48 flex-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            void loadProducts(search, e.target.value);
          }}
          aria-label={t("Categoria")}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">{t("Todas")}</option>
          {data?.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold">
          {t("Buscar")}
        </button>
      </form>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass aspect-[3/4] animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="glass mx-auto max-w-xl space-y-4 rounded-2xl p-10 text-center">
          <h2 className="text-lg font-bold text-foreground">{t("Nenhum produto ainda")}</h2>
          <p className="text-sm text-muted">{t("Cadastre o primeiro produto e adicione o bloco “Galeria da loja” ao seu perfil.")}</p>
          <Link href={`/${lang}/store/products/new`} className="inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-hover">
            {t("Cadastrar produto")}
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/${lang}/store/products/${product.id}`}
                className="glass group flex h-full flex-col overflow-hidden rounded-2xl transition hover:border-border-hover"
              >
                <div className="relative aspect-square bg-surface-hover">
                  {product.images[0] ? (
                    <Image unoptimized fill sizes="(min-width: 768px) 25vw, 50vw" src={product.images[0].url} alt="" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl font-black text-muted/40">
                      {product.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {!product.isActive && (
                      <span className="rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-semibold text-paper">{t("Oculto")}</span>
                    )}
                    {product.isFeatured && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">{t("Destaque")}</span>
                    )}
                    {product.stock === 0 && (
                      <span className="rounded-full bg-error px-2 py-0.5 text-[11px] font-semibold text-white">{t("Esgotado")}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="text-xs text-muted">
                    {t(product.type === "PHYSICAL" ? "Produto" : product.type === "DIGITAL" ? "Digital" : "Serviço")}
                    {product.category && ` · ${product.category.name}`}
                  </p>
                  <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
                    <span className="text-sm font-bold text-foreground">{formatPrice(product.priceCents, lang)}</span>
                    {product.stock !== null && <span className="text-xs text-muted">{product.stock} {t("em estoque")}</span>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
