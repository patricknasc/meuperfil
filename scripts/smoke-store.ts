import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/db/client";
import { getRedisConnection } from "../lib/queue/client";
import { expireStaleOrders } from "../lib/store/orders";

/**
 * HTTP smoke for the store against a local dev server on :3015.
 * Creates two temporary workspaces, exercises the owner API, the public
 * catalog and workspace isolation, then deletes everything it created.
 */

const BASE = "http://localhost:3015";
// 1×1 transparent PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

async function main() {
  assert(["localhost", "127.0.0.1", "::1"].includes(new URL(process.env.DATABASE_URL!).hostname));
  const userIds: string[] = [];
  const tokens: string[] = [];
  const workspaces: string[] = [];
  const handle = `smoke-${randomUUID().slice(0, 8)}`;

  async function request(path: string, token?: string, method = "GET", body?: unknown) {
    const isForm = body instanceof FormData;
    return fetch(`${BASE}${path}`, {
      method,
      redirect: "manual",
      headers: {
        ...(token ? { Cookie: `authjs.session-token=${token}` } : {}),
        ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: isForm ? body : JSON.stringify(body) } : {}),
    });
  }

  try {
    for (let index = 0; index < 2; index++) {
      const user = await prisma.user.create({ data: { email: `store-smoke-${randomUUID()}@example.com` } });
      userIds.push(user.id);
      const workspace = await prisma.workspace.create({
        data: { name: `Loja Smoke ${index}`, ownerId: user.id, members: { create: { userId: user.id, role: "OWNER" } } },
      });
      workspaces.push(workspace.id);
      const token = randomUUID();
      tokens.push(token);
      await prisma.session.create({ data: { sessionToken: token, userId: user.id, expires: new Date(Date.now() + 3600_000) } });
    }
    const profile = await prisma.profile.create({
      data: { workspaceId: workspaces[0], handle, displayName: "Loja Smoke", theme: "MINIMAL_LIGHT" },
    });

    // Auth and lazy store creation
    assert.equal((await request("/api/store")).status, 401);
    const storeRes = await request("/api/store", tokens[0]);
    assert.equal(storeRes.status, 200);
    const storeData = (await storeRes.json()).data;
    assert.equal(storeData.store.name, "Loja Smoke 0");
    assert.deepEqual(storeData.profiles, [{ handle, isPublished: true }]);

    // Settings validation
    const badSettings = await request("/api/store", tokens[0], "PUT", {
      name: "Loja Smoke",
      acceptWhatsapp: true,
      acceptPixDirect: false,
      pickupEnabled: false,
      quoteShipping: false,
    });
    assert.equal(badSettings.status, 400);
    const goodSettings = await request("/api/store", tokens[0], "PUT", {
      name: "Loja Smoke",
      description: "Camisetas e consultorias",
      acceptWhatsapp: true,
      whatsappPhone: "11 99999-8888",
      acceptPixDirect: false,
      pickupEnabled: false,
      quoteShipping: false,
      returnPolicy: "Trocas em 7 dias.",
    });
    assert.equal(goodSettings.status, 200);
    assert.equal((await goodSettings.json()).data.whatsappPhone, "5511999998888");

    // Upload: real image accepted, disguised file rejected
    const form = new FormData();
    form.append("file", new Blob([PNG], { type: "image/png" }), "pixel.png");
    const upload = await request("/api/store/media", tokens[0], "POST", form);
    assert.equal(upload.status, 201);
    const media = (await upload.json()).data;
    assert(media.storagePath.startsWith(`${workspaces[0]}/`));
    assert.equal((await fetch(`${BASE}${media.url}`)).status, 200);
    const fake = new FormData();
    fake.append("file", new Blob(["<svg onload=alert(1)>"], { type: "image/png" }), "x.png");
    assert.equal((await request("/api/store/media", tokens[0], "POST", fake)).status, 400);

    // Categories and products
    const categoryRes = await request("/api/store/categories", tokens[0], "POST", { name: "Camisetas" });
    assert.equal(categoryRes.status, 201);
    const category = (await categoryRes.json()).data;

    const shirtRes = await request("/api/store/products", tokens[0], "POST", {
      type: "PHYSICAL",
      name: "Camiseta Azul",
      description: "Algodão orgânico",
      priceCents: 4990,
      compareAtCents: 6990,
      stock: 5,
      categoryId: category.id,
      tags: ["Algodão", "verão"],
      weightGrams: 300,
      heightCm: 4,
      widthCm: 25,
      lengthCm: 30,
      isFeatured: true,
      images: [{ storagePath: media.storagePath }],
    });
    assert.equal(shirtRes.status, 201, await shirtRes.clone().text());
    const shirt = (await shirtRes.json()).data;
    assert.equal(shirt.slug, "camiseta-azul");
    assert.deepEqual(shirt.tags, ["algodão", "verão"]);

    const ebookRes = await request("/api/store/products", tokens[0], "POST", {
      type: "DIGITAL",
      name: "E-book de Receitas",
      priceCents: 2990,
      digitalDeliveryUrl: "https://files.example.com/receitas.pdf",
    });
    assert.equal(ebookRes.status, 201);
    const ebook = (await ebookRes.json()).data;
    assert.equal(ebook.digitalDeliveryUrl, "https://files.example.com/receitas.pdf");
    const hiddenRes = await request("/api/store/products", tokens[0], "POST", {
      type: "SERVICE",
      name: "Consultoria Secreta",
      priceCents: 50000,
      isActive: false,
    });
    assert.equal(hiddenRes.status, 201);

    // Duplicate names get a unique slug
    const dupRes = await request("/api/store/products", tokens[0], "POST", { type: "SERVICE", name: "Camiseta Azul", priceCents: 100 });
    assert.equal((await dupRes.json()).data.slug, "camiseta-azul-2");

    // Workspace isolation
    assert.equal((await request(`/api/store/products/${shirt.id}`, tokens[1])).status, 404);
    assert.equal((await request(`/api/store/products/${shirt.id}`, tokens[1], "DELETE")).status, 404);
    const stolen = await request("/api/store/products", tokens[1], "POST", {
      type: "SERVICE",
      name: "Roubo de imagem",
      priceCents: 100,
      images: [{ storagePath: media.storagePath }],
    });
    assert.equal(stolen.status, 400);

    // STORE block on the profile
    const blockRes = await request(`/api/profiles/${profile.id}/blocks`, tokens[0], "POST", {
      type: "STORE",
      title: "Minha loja",
      config: { mode: "featured", limit: 4 },
    });
    assert.equal(blockRes.status, 201, await blockRes.clone().text());
    const badBlock = await request(`/api/profiles/${profile.id}/blocks`, tokens[0], "POST", {
      type: "STORE",
      title: "Loja",
      config: { limit: 99 },
    });
    assert.equal(badBlock.status, 400);

    for (const locale of ["pt", "en", "es"]) {
      const bio = await request(`/${locale}/${handle}`);
      assert.equal(bio.status, 200);
      const bioHtml = await bio.text();
      assert(bioHtml.includes("Minha loja") && bioHtml.includes("Camiseta Azul"), "bio page shows the gallery");
      assert(!bioHtml.includes("Consultoria Secreta"), "hidden products stay hidden");

      const shop = await request(`/${locale}/${handle}/loja`);
      assert.equal(shop.status, 200);
      const shopHtml = await shop.text();
      assert(shopHtml.includes("Camiseta Azul") && shopHtml.includes("E-book de Receitas"));
      assert(!shopHtml.includes("Consultoria Secreta"));
      assert(!shopHtml.includes("files.example.com"), "digital link never reaches public pages");

      const search = await (await request(`/${locale}/${handle}/loja?q=receitas`)).text();
      assert(search.includes("E-book de Receitas") && !search.includes("Camiseta Azul"));
      const byTag = await (await request(`/${locale}/${handle}/loja?q=algod%C3%A3o`)).text();
      assert(byTag.includes("Camiseta Azul"));
      const byCategory = await (await request(`/${locale}/${handle}/loja?category=camisetas`)).text();
      assert(byCategory.includes("Camiseta Azul") && !byCategory.includes("E-book de Receitas"));
      const byPrice = await (await request(`/${locale}/${handle}/loja?min=40&sort=price_asc`)).text();
      assert(byPrice.includes("Camiseta Azul") && !byPrice.includes("E-book de Receitas"));
      assert.equal((await request(`/${locale}/${handle}/loja?page=abc&sort=hack`)).status, 200);

      const detail = await request(`/${locale}/${handle}/loja/camiseta-azul`);
      assert.equal(detail.status, 200);
      const detailHtml = await detail.text();
      assert(detailHtml.includes("application/ld+json") && detailHtml.includes("Algodão orgânico"));
      assert(detailHtml.includes("Trocas em 7 dias."));
      assert.equal((await request(`/${locale}/${handle}/loja/consultoria-secreta`)).status, 404);
      assert.equal((await request(`/${locale}/${handle}/loja/nao-existe`)).status, 404);

      const admin = await request(`/${locale}/store`, tokens[0]);
      assert.equal(admin.status, 200);
      assert.equal((await request(`/${locale}/store/products/${shirt.id}`, tokens[0])).status, 200);
      assert.equal((await request(`/${locale}/store/settings`, tokens[0])).status, 200);
    }
    assert.equal((await request(`/pt/store`)).status, 307, "dashboard requires login");

    // ─── Orders ──────────────────────────────────────────────────────────────
    const rateKeys = await getRedisConnection().keys("rate:store:*");
    if (rateKeys.length) await getRedisConnection().del(...rateKeys);
    const settings = await request("/api/store", tokens[0], "PUT", {
      name: "Loja Smoke",
      acceptWhatsapp: true,
      whatsappPhone: "11 99999-8888",
      acceptPixDirect: true,
      pixKeyType: "EMAIL",
      pixKey: "pix@example.com",
      pixMerchantName: "Loja Smoke",
      pixMerchantCity: "Sao Paulo",
      pickupEnabled: true,
      pickupAddress: "Rua das Flores, 10",
      flatShippingCents: 1500,
      freeShippingOverCents: 20000,
      quoteShipping: false,
    });
    assert.equal(settings.status, 200, await settings.clone().text());
    const otherProfile = await prisma.profile.create({ data: { workspaceId: workspaces[1], handle: `${handle}-b`, displayName: "Outra" } });
    await request("/api/store", tokens[1]);

    const api = `/api/store/public/${handle}`;
    const cart = await (await request(`${api}/cart`, undefined, "POST", { items: [{ productId: shirt.id, quantity: 2 }] })).json();
    assert.deepEqual(cart.data.channels, { WHATSAPP: true, PIX_DIRECT: true });
    assert.equal(cart.data.products[0].priceCents, 4990);

    const shippingRes = await (await request(`${api}/shipping`, undefined, "POST", { items: [{ productId: shirt.id, quantity: 2 }] })).json();
    assert.deepEqual(shippingRes.data.options.map((o: { id: string }) => o.id), ["pickup", "flat"]);
    const digitalShipping = await (await request(`${api}/shipping`, undefined, "POST", { items: [{ productId: ebook.id, quantity: 1 }] })).json();
    assert.deepEqual(digitalShipping.data.options.map((o: { id: string }) => o.id), ["none"]);

    const address = { zip: "01310-100", street: "Av. Paulista", number: "1000", district: "Bela Vista", city: "São Paulo", state: "SP" };
    const customer = { name: "Ana Compradora", phone: "(11) 98888-7777", email: "ana@example.com" };

    // Client-sent prices are ignored; tampered shipping is refused.
    const tampered = await request(`${api}/orders`, undefined, "POST", {
      items: [{ productId: shirt.id, quantity: 1, priceCents: 1 }],
      channel: "WHATSAPP",
      customer,
      shippingOptionId: "quote:1",
      address,
    });
    assert.equal(tampered.status, 409);
    const noAddress = await request(`${api}/orders`, undefined, "POST", { items: [{ productId: shirt.id, quantity: 1 }], channel: "WHATSAPP", customer, shippingOptionId: "flat" });
    assert.equal(noAddress.status, 409);
    const hiddenOrder = await request(`${api}/orders`, undefined, "POST", {
      items: [{ productId: (await hiddenRes.json()).data.id, quantity: 1 }],
      channel: "WHATSAPP",
      customer,
      shippingOptionId: "none",
    });
    assert.equal(hiddenOrder.status, 409, "hidden products cannot be ordered");

    const waRes = await request(`${api}/orders`, undefined, "POST", {
      items: [{ productId: shirt.id, quantity: 2, priceCents: 1 }],
      channel: "WHATSAPP",
      customer: { ...customer, note: "Embrulhar para presente" },
      shippingOptionId: "flat",
      address,
      locale: "pt",
    });
    assert.equal(waRes.status, 201, await waRes.clone().text());
    const wa = (await waRes.json()).data;
    assert.equal(wa.number, 1);
    assert(wa.whatsappUrl.startsWith("https://wa.me/5511999998888?text="));
    assert(decodeURIComponent(wa.whatsappUrl).includes("Embrulhar para presente"));
    const waOrder = await prisma.order.findUniqueOrThrow({ where: { publicToken: wa.publicToken } });
    assert.equal(waOrder.totalCents, 2 * 4990 + 1500);
    assert.equal(waOrder.status, "PENDING");
    assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: shirt.id } })).stock, 3, "stock reserved");

    const waPage = await request(`/pt/${handle}/pedido/${wa.publicToken}?novo=1`);
    assert.equal(waPage.status, 200);
    const waHtml = await waPage.text();
    assert(waHtml.includes("Enviar pedido no WhatsApp") && waHtml.includes("Av. Paulista, 1000"));
    assert.equal((await request(`/pt/${otherProfile.handle}/pedido/${wa.publicToken}`)).status, 404, "token only works under the seller's handle");
    assert.equal((await request(`/pt/${handle}/pedido/nao-existe-token-falso-123`)).status, 404);

    const pixRes = await request(`${api}/orders`, undefined, "POST", {
      items: [{ productId: ebook.id, quantity: 1 }],
      channel: "PIX_DIRECT",
      customer,
      shippingOptionId: "none",
      locale: "en",
    });
    assert.equal(pixRes.status, 201);
    const pix = (await pixRes.json()).data;
    const pixHtml = await (await request(`/en/${handle}/pedido/${pix.publicToken}`)).text();
    assert(pixHtml.includes("000201") && pixHtml.includes("br.gov.bcb.pix") && pixHtml.includes("<svg"), "Pix QR and copy-paste code");
    assert(pixHtml.includes("Awaiting payment"));
    assert(!pixHtml.includes("files.example.com"), "digital link hidden before payment");

    // Two buyers race for the last unit: exactly one wins.
    await prisma.product.update({ where: { id: shirt.id }, data: { stock: 1 } });
    const race = await Promise.all(
      [0, 1].map(() =>
        request(`${api}/orders`, undefined, "POST", { items: [{ productId: shirt.id, quantity: 1 }], channel: "WHATSAPP", customer, shippingOptionId: "pickup" })
      )
    );
    assert.deepEqual(race.map((r) => r.status).sort(), [201, 409]);
    assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: shirt.id } })).stock, 0);

    // Owner management and isolation
    const list = await (await request("/api/store/orders", tokens[0])).json();
    assert.equal(list.data.total, 3);
    assert.equal(list.data.summary.pendingCount, 3);
    assert.equal((await (await request("/api/store/orders", tokens[1])).json()).data.total, 0);
    assert.equal((await request(`/api/store/orders/${waOrder.id}`, tokens[1])).status, 404);
    assert.equal((await request(`/api/store/orders/${waOrder.id}`, tokens[1], "PATCH", { status: "PAID" })).status, 404);
    const byNumber = await (await request("/api/store/orders?search=%231", tokens[0])).json();
    assert.equal(byNumber.data.orders[0].number, 1);

    const pixOrder = await prisma.order.findUniqueOrThrow({ where: { publicToken: pix.publicToken } });
    assert.equal((await request(`/api/store/orders/${pixOrder.id}`, tokens[0], "PATCH", { status: "PAID" })).status, 200);
    assert.equal((await request(`/api/store/orders/${pixOrder.id}`, tokens[0], "PATCH", { status: "CANCELED" })).status, 400, "paid orders cannot be canceled");
    const paidHtml = await (await request(`/en/${handle}/pedido/${pix.publicToken}`)).text();
    assert(paidHtml.includes("files.example.com/receitas.pdf"), "digital link released after payment");
    assert(!paidHtml.includes("br.gov.bcb.pix"), "no Pix code once paid");

    // Canceling an unpaid order returns stock; so does expiry.
    assert.equal((await request(`/api/store/orders/${waOrder.id}`, tokens[0], "PATCH", { status: "CANCELED" })).status, 200);
    assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: shirt.id } })).stock, 2);
    const raceWinner = await prisma.order.findFirstOrThrow({ where: { storeId: waOrder.storeId, status: "PENDING" } });
    await prisma.order.update({ where: { id: raceWinner.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    assert((await expireStaleOrders()) >= 1);
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: raceWinner.id } })).status, "CANCELED");
    assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: shirt.id } })).stock, 3);

    // Buyers become STORE leads in the CRM.
    const lead = await prisma.contact.findFirst({ where: { workspaceId: workspaces[0], source: "STORE" } });
    assert(lead && lead.phone === "11988887777" && lead.tags.includes("cliente-loja"));
    assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: waOrder.id } })).contactId, lead.id);

    for (const locale of ["pt", "en", "es"]) {
      assert.equal((await request(`/${locale}/${handle}/carrinho`)).status, 200);
      assert.equal((await request(`/${locale}/store/orders`, tokens[0])).status, 200);
      assert.equal((await request(`/${locale}/store/orders/${waOrder.id}`, tokens[0])).status, 200);
    }

    // Members can read but not change the store
    await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: workspaces[0], userId: userIds[0] } },
      data: { role: "MEMBER" },
    });
    assert.equal((await request(`/api/store/products/${shirt.id}`, tokens[0], "DELETE")).status, 403);

    console.log("Store smoke passed: settings, uploads, products, isolation, bio gallery, catalog, checkout, Pix, WhatsApp, stock races, order management, expiry and CRM in three languages.");
  } finally {
    if (workspaces.length) await prisma.workspace.deleteMany({ where: { id: { in: workspaces } } });
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
    getRedisConnection().disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
