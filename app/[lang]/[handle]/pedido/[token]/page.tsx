import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { getThemeConfig } from "@/lib/profiles/themes";
import { storeTranslator } from "@/lib/i18n/store";
import { formatPrice } from "@/lib/store/money";
import { getPublicStoreByHandle } from "@/lib/store/service";
import { getOrderForBuyer } from "@/lib/store/orders";
import { buildWhatsAppOrderMessage, whatsAppLink } from "@/lib/store/whatsapp";
import { getBaseUrl } from "@/lib/env";
import { StoreShell } from "@/components/store/store-shell";
import { CopyButton } from "@/components/store/copy-button";

interface PageProps {
  params: Promise<{ lang: string; handle: string; token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${storeTranslator(lang)("Pedido")} | meuperfil.me`, robots: { index: false, follow: false } };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Aguardando confirmação",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAID: "Pagamento confirmado",
  PREPARING: "Em preparação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export default async function OrderPage({ params, searchParams }: PageProps) {
  const { lang, handle, token } = await params;
  const t = storeTranslator(lang);
  const [storeData, data] = await Promise.all([getPublicStoreByHandle(handle), getOrderForBuyer(token)]);
  if (!storeData || !data || data.store.workspaceId !== storeData.profile.workspaceId) notFound();

  const { order, store, pixPayload, address } = data;
  const isNew = (await searchParams).novo === "1";
  const theme = getThemeConfig(storeData.profile.theme);
  const radius = theme.classes.linkRadius ?? "rounded-2xl";
  const card = `${radius} ${theme.classes.linkCard}`;
  const button = `${radius} ${theme.classes.linkCard} ${theme.classes.linkCardHover} inline-flex w-full items-center justify-center px-5 py-3.5 text-sm font-bold`;
  const orderUrl = `${getBaseUrl()}/${lang}/${storeData.profile.handle}/pedido/${order.publicToken}`;

  const whatsappUrl =
    store.whatsappPhone && order.status === "PENDING" && order.channel === "WHATSAPP"
      ? whatsAppLink(
          store.whatsappPhone,
          buildWhatsAppOrderMessage(
            {
              number: order.number,
              customerName: order.customerName,
              items: order.items,
              shippingLabel: order.shippingLabel,
              shippingCents: order.shippingCents,
              totalCents: order.totalCents,
              orderUrl,
              customerNote: order.customerNote,
            },
            lang
          )
        )
      : null;
  const receiptUrl =
    store.whatsappPhone && pixPayload
      ? whatsAppLink(store.whatsappPhone, `${t("Olá! Segue o comprovante do Pix do pedido")} #${order.number}: ${orderUrl}`)
      : null;
  const qrSvg = pixPayload ? await QRCode.toString(pixPayload, { type: "svg", margin: 1, width: 240, errorCorrectionLevel: "M" }) : null;

  return (
    <StoreShell lang={lang} profile={storeData.profile} storeName={store.name}>
      <div className="mx-auto max-w-xl space-y-5">
        <div className="space-y-1 text-center">
          {isNew && <p className="text-sm font-semibold text-emerald-500">{t("Pedido registrado!")}</p>}
          <h1 className={`text-2xl ${theme.classes.displayName}`}>
            {t("Pedido")} #{order.number}
          </h1>
          <p className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${theme.classes.handleBadge}`}>{t(STATUS_LABEL[order.status])}</p>
        </div>

        {whatsappUrl && (
          <section className={`space-y-3 p-4 text-center ${card}`}>
            <p className="text-sm">{t("Falta só enviar o pedido para o vendedor pelo WhatsApp.")}</p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${button} !bg-emerald-500 !text-white`}>
              {t("Enviar pedido no WhatsApp")}
            </a>
          </section>
        )}

        {pixPayload && qrSvg && (
          <section className={`space-y-4 p-4 text-center ${card}`}>
            <p className="text-sm font-semibold">
              {t("Pague")} {formatPrice(order.totalCents, lang)} {t("com Pix")}
            </p>
            <div
              className="mx-auto w-60 rounded-xl bg-white p-2 [&>svg]:h-auto [&>svg]:w-full"
              role="img"
              aria-label={t("QR Code Pix")}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className={`text-xs ${theme.classes.bio}`}>{t("Abra o app do seu banco, escolha Pix e leia o QR Code, ou use o Pix copia e cola.")}</p>
            <textarea readOnly value={pixPayload} rows={3} aria-label={t("Pix copia e cola")} className="w-full resize-none rounded-xl border border-current/20 bg-transparent p-2 font-mono text-[11px]" />
            <CopyButton value={pixPayload} label={t("Copiar código Pix")} copiedLabel={t("Copiado!")} className={button} />
            {receiptUrl && (
              <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className={`block text-sm underline ${theme.classes.bio}`}>
                {t("Enviar comprovante pelo WhatsApp")}
              </a>
            )}
            <p className={`text-xs ${theme.classes.bio}`}>{t("O vendedor confirma o pagamento e você acompanha o status nesta página.")}</p>
          </section>
        )}

        <section className={`space-y-3 p-4 ${card}`}>
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">{t("Itens")}</h2>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/5">
                  {item.imageUrl && <Image unoptimized fill sizes="48px" src={item.imageUrl} alt="" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {item.quantity}× {item.name}
                  </p>
                  {item.deliveryUrl && (
                    <a href={item.deliveryUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-500 underline">
                      {t("Acessar conteúdo digital")}
                    </a>
                  )}
                </div>
                <span className="font-semibold">{formatPrice(item.unitPriceCents * item.quantity, lang)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-current/10 pt-3 text-sm">
            {order.shippingLabel && (
              <div className="flex justify-between gap-3">
                <span className="opacity-70">{order.shippingLabel}</span>
                <span>{order.shippingCents ? formatPrice(order.shippingCents, lang) : t("Grátis")}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span>{t("Total")}</span>
              <span>{formatPrice(order.totalCents, lang)}</span>
            </div>
          </div>
        </section>

        {(address || order.trackingCode) && (
          <section className={`space-y-2 p-4 text-sm ${card}`}>
            {address && (
              <p>
                <span className="font-semibold">{t("Entregar em")}:</span> {address}
              </p>
            )}
            {order.trackingCode && (
              <p>
                <span className="font-semibold">{t("Código de rastreio")}:</span> <span className="font-mono">{order.trackingCode}</span>
              </p>
            )}
          </section>
        )}

        <p className={`text-center text-xs ${theme.classes.bio}`}>{t("Guarde este link para acompanhar o pedido.")}</p>
        <Link href={`/${lang}/${storeData.profile.handle}/loja`} className={`block text-center text-sm underline ${theme.classes.bio}`}>
          {t("Voltar à loja")}
        </Link>
      </div>
    </StoreShell>
  );
}
