"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { storeTranslator } from "@/lib/i18n/store";
import { parsePriceInput } from "@/lib/store/money";
import type { AdminCategory, AdminProduct, AdminProductImage, ProductTypeValue } from "./admin-types";

const MAX_IMAGES = 8;

interface ProductFormProps {
  lang: string;
  categories: AdminCategory[];
  product?: AdminProduct;
}

function centsToInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function intOrNull(value: string) {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
}

const input = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none";
const label = "block space-y-1 text-sm";
const labelText = "font-medium text-foreground";
const hint = "text-xs text-muted";

export function ProductForm({ lang, categories, product }: ProductFormProps) {
  const t = storeTranslator(lang);
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<ProductTypeValue>(product?.type ?? "PHYSICAL");
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(centsToInput(product?.priceCents));
  const [compareAt, setCompareAt] = useState(centsToInput(product?.compareAtCents));
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [tags, setTags] = useState(product?.tags.join(", ") ?? "");
  const [weight, setWeight] = useState(product?.weightGrams != null ? String(product.weightGrams) : "");
  const [height, setHeight] = useState(product?.heightCm != null ? String(product.heightCm) : "");
  const [width, setWidth] = useState(product?.widthCm != null ? String(product.widthCm) : "");
  const [length, setLength] = useState(product?.lengthCm != null ? String(product.lengthCm) : "");
  const [digitalUrl, setDigitalUrl] = useState(product?.digitalDeliveryUrl ?? "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [images, setImages] = useState<AdminProductImage[]>(product?.images ?? []);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    try {
      const room = MAX_IMAGES - images.length;
      for (const file of Array.from(files).slice(0, room)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/store/media", { method: "POST", body: form });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setImages((current) => [...current, { url: json.data.url, storagePath: json.data.storagePath, alt: null }]);
      }
      if (files.length > room) setError(t("Limite de 8 imagens por produto."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível enviar a imagem."));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function moveImage(index: number, delta: number) {
    setImages((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const priceCents = parsePriceInput(price);
    if (!priceCents) return setError(t("Informe um preço válido, ex.: 49,90."));

    const body = {
      type,
      name,
      description: description || null,
      priceCents,
      compareAtCents: compareAt ? parsePriceInput(compareAt) : null,
      stock: intOrNull(stock),
      sku: sku || null,
      categoryId: categoryId || null,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      weightGrams: type === "PHYSICAL" ? intOrNull(weight) : null,
      heightCm: type === "PHYSICAL" ? intOrNull(height) : null,
      widthCm: type === "PHYSICAL" ? intOrNull(width) : null,
      lengthCm: type === "PHYSICAL" ? intOrNull(length) : null,
      digitalDeliveryUrl: type === "DIGITAL" ? digitalUrl || null : null,
      isActive,
      isFeatured,
      images: images.filter((i) => i.storagePath).map((i) => ({ storagePath: i.storagePath, alt: i.alt })),
    };

    setSaving(true);
    try {
      const res = await fetch(product ? `/api/store/products/${product.id}` : "/api/store/products", {
        method: product ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.push(`/${lang}/store`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível salvar."));
      setSaving(false);
    }
  }

  async function remove() {
    if (!product || !window.confirm(t("Excluir este produto? Esta ação não pode ser desfeita."))) return;
    setSaving(true);
    const res = await fetch(`/api/store/products/${product.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) {
      setError(json.error);
      setSaving(false);
      return;
    }
    router.push(`/${lang}/store`);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="glass space-y-4 rounded-2xl p-4 sm:p-6">
          <fieldset>
            <legend className={`${labelText} mb-2 text-sm`}>{t("Tipo")}</legend>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["PHYSICAL", "Produto físico", "Enviado pelos Correios ou transportadora"],
                  ["DIGITAL", "Digital", "Link liberado após o pagamento"],
                  ["SERVICE", "Serviço", "Combinado com o cliente"],
                ] as const
              ).map(([value, title, description]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl border p-3 text-xs transition ${
                    type === value ? "border-accent bg-accent/5" : "border-border bg-surface hover:border-border-hover"
                  }`}
                >
                  <input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} className="sr-only" />
                  <span className="block text-sm font-semibold text-foreground">{t(title)}</span>
                  <span className="mt-0.5 hidden text-muted sm:block">{t(description)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className={label}>
            <span className={labelText}>{t("Nome")}</span>
            <input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={input} />
          </label>

          <label className={label}>
            <span className={labelText}>{t("Descrição")}</span>
            <textarea rows={6} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
          </label>
        </section>

        <section className="glass space-y-4 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{t("Imagens")}</h2>
            <span className={hint}>
              {images.length}/{MAX_IMAGES}
            </span>
          </div>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((image, index) => (
              <li key={image.storagePath ?? image.url} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-hover">
                <Image unoptimized fill sizes="160px" src={image.url} alt="" className="object-cover" />
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-paper">{t("Capa")}</span>
                )}
                <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    aria-label={t("Mover para a esquerda")}
                    className="rounded-lg bg-paper/90 px-2 py-0.5 text-xs font-bold text-ink disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
                    aria-label={t("Remover imagem")}
                    className="rounded-lg bg-paper/90 px-2 py-0.5 text-xs font-bold text-error"
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label={t("Mover para a direita")}
                    className="rounded-lg bg-paper/90 px-2 py-0.5 text-xs font-bold text-ink disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              </li>
            ))}
            {images.length < MAX_IMAGES && (
              <li>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-xs font-semibold text-muted transition hover:border-accent hover:text-accent disabled:opacity-60"
                >
                  <span className="text-2xl leading-none">+</span>
                  {uploading ? t("Enviando…") : t("Adicionar")}
                </button>
              </li>
            )}
          </ul>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => void uploadFiles(e.target.files)}
          />
          <p className={hint}>{t("JPEG, PNG ou WebP até 5 MB. A primeira imagem é a capa.")}</p>
        </section>

        {type === "PHYSICAL" && (
          <section className="glass space-y-4 rounded-2xl p-4 sm:p-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t("Peso e medidas da embalagem")}</h2>
              <p className={hint}>{t("Usados para calcular o frete pelo CEP do cliente.")}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className={label}>
                <span className={labelText}>{t("Peso (g)")}</span>
                <input required inputMode="numeric" type="number" min={1} max={30000} value={weight} onChange={(e) => setWeight(e.target.value)} className={input} />
              </label>
              <label className={label}>
                <span className={labelText}>{t("Altura (cm)")}</span>
                <input required inputMode="numeric" type="number" min={1} max={200} value={height} onChange={(e) => setHeight(e.target.value)} className={input} />
              </label>
              <label className={label}>
                <span className={labelText}>{t("Largura (cm)")}</span>
                <input required inputMode="numeric" type="number" min={1} max={200} value={width} onChange={(e) => setWidth(e.target.value)} className={input} />
              </label>
              <label className={label}>
                <span className={labelText}>{t("Comprimento (cm)")}</span>
                <input required inputMode="numeric" type="number" min={1} max={200} value={length} onChange={(e) => setLength(e.target.value)} className={input} />
              </label>
            </div>
          </section>
        )}

        {type === "DIGITAL" && (
          <section className="glass space-y-4 rounded-2xl p-4 sm:p-6">
            <label className={label}>
              <span className={labelText}>{t("Link de entrega")}</span>
              <input type="url" placeholder="https://" maxLength={2000} value={digitalUrl} onChange={(e) => setDigitalUrl(e.target.value)} className={input} />
              <span className={hint}>{t("O cliente só vê este link depois que o pagamento for confirmado.")}</span>
            </label>
          </section>
        )}
      </div>

      <aside className="space-y-6">
        <section className="glass space-y-4 rounded-2xl p-4 sm:p-6">
          <label className={label}>
            <span className={labelText}>{t("Preço")}</span>
            <input required inputMode="decimal" placeholder="49,90" value={price} onChange={(e) => setPrice(e.target.value)} className={input} />
          </label>
          <label className={label}>
            <span className={labelText}>{t("Preço “de” (opcional)")}</span>
            <input inputMode="decimal" placeholder="69,90" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} className={input} />
            <span className={hint}>{t("Aparece riscado ao lado do preço.")}</span>
          </label>
          <label className={label}>
            <span className={labelText}>{t("Estoque")}</span>
            <input inputMode="numeric" type="number" min={0} placeholder={t("Ilimitado")} value={stock} onChange={(e) => setStock(e.target.value)} className={input} />
            <span className={hint}>{t("Deixe em branco para não controlar estoque.")}</span>
          </label>
          <label className={label}>
            <span className={labelText}>SKU</span>
            <input maxLength={60} value={sku} onChange={(e) => setSku(e.target.value)} className={input} />
          </label>
        </section>

        <section className="glass space-y-4 rounded-2xl p-4 sm:p-6">
          <label className={label}>
            <span className={labelText}>{t("Categoria")}</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={input}>
              <option value="">{t("Sem categoria")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className={label}>
            <span className={labelText}>{t("Palavras-chave")}</span>
            <input placeholder={t("ex.: algodão, verão")} value={tags} onChange={(e) => setTags(e.target.value)} className={input} />
            <span className={hint}>{t("Separe por vírgula. Ajudam na busca da loja.")}</span>
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className={labelText}>{t("Visível na loja")}</span>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5 accent-accent" />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className={labelText}>{t("Destaque na galeria do perfil")}</span>
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-5 w-5 accent-accent" />
          </label>
        </section>

        {error && (
          <div role="alert" className="rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? t("Salvando…") : product ? t("Salvar alterações") : t("Cadastrar produto")}
          </button>
          {product && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={saving}
              className="rounded-xl border border-error/30 px-4 py-2.5 text-sm font-semibold text-error transition hover:bg-error/5 disabled:opacity-60"
            >
              {t("Excluir produto")}
            </button>
          )}
        </div>
      </aside>
    </form>
  );
}
