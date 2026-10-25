import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/db/client";

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

    // Members can read but not change the store
    await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: workspaces[0], userId: userIds[0] } },
      data: { role: "MEMBER" },
    });
    assert.equal((await request(`/api/store/products/${shirt.id}`, tokens[0], "DELETE")).status, 403);

    console.log("Store smoke passed: settings, uploads, products, isolation, bio gallery, catalog search/filters and pages in three languages.");
  } finally {
    if (workspaces.length) await prisma.workspace.deleteMany({ where: { id: { in: workspaces } } });
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
