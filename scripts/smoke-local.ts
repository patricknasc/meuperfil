import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/db/client";
async function main() {
  assert(["localhost", "127.0.0.1", "::1"].includes(new URL(process.env.DATABASE_URL!).hostname));
  const userIds: string[] = [];
  const tokens: string[] = [];
  const workspaces: string[] = [];
  try {
    for (let index = 0; index < 2; index++) {
      const user = await prisma.user.create({ data: { email: `http-smoke-${randomUUID()}@example.com` } }); userIds.push(user.id);
      const workspace = await prisma.workspace.create({ data: { name: "Temporary HTTP smoke", ownerId: user.id, members: { create: { userId: user.id, role: "OWNER" } } } }); workspaces.push(workspace.id);
      const token = randomUUID(); tokens.push(token);
      await prisma.session.create({ data: { sessionToken: token, userId: user.id, expires: new Date(Date.now() + 3600_000) } });
    }
    const contact = await prisma.contact.create({ data: { workspaceId: workspaces[0], identityKey: "smoke-person", name: "Temporary smoke lead", source: "MANUAL" } });
    const account = await prisma.instagramAccount.create({ data: { workspaceId: workspaces[0], instagramId: randomUUID(), username: "smoke-test", accessToken: "test-only-credential" } });
    async function request(path: string, token?: string, method = "GET", body?: unknown) {
      return fetch(`http://localhost:3015${path}`, { method, redirect: "manual", headers: { ...(token ? { Cookie: `authjs.session-token=${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    }
    assert.equal((await request("/api/leads")).status, 401);
    const own = await request("/api/leads", tokens[0]); assert.equal(own.status, 200);
    assert.equal((await own.json()).data.length, 1);
    const other = await request("/api/leads", tokens[1]); assert.equal((await other.json()).data.length, 0);
    assert.equal((await request(`/api/leads/${contact.id}`, tokens[1], "PATCH", { status: "CONVERTED" })).status, 404);
    assert.equal((await request(`/api/leads/${contact.id}`, tokens[0], "PATCH", { status: "QUALIFIED" })).status, 200);
    const postResponse = await request("/api/scheduler/posts", tokens[0], "POST", { instagramAccountId: account.id, mediaUrls: ["https://example.com/photo.jpg"], mediaType: "IMAGE" });
    assert.equal(postResponse.status, 201);
    const post = (await postResponse.json()).data;
    assert(!Object.hasOwn(post.instagramAccount, "accessToken"));
    assert.equal(post.status, "DRAFT");
    assert.equal((await request("/api/scheduler/posts?status=invalid", tokens[0])).status, 400);
    const reportSlug = randomUUID();
    await prisma.automation.create({ data: { workspaceId: workspaces[0], instagramAccountId: account.id, name: "Temporary smoke campaign", postId: "temporary", keywords: ["LINK"], dmMessage: "Test", isActive: false, reportShareSlug: reportSlug } });
    for (const locale of ["pt", "en", "es"]) {
      const page = await request(`/${locale}/leads`, tokens[0]); assert.equal(page.status, 200);
      assert((await page.text()).includes("Temporary smoke lead"));
      const login = await request(`/${locale}/login`); assert.equal(login.status, 200);
      assert((await login.text()).includes(locale === "pt" ? "Enviar link de acesso" : locale === "en" ? "Email me a magic link" : "Enviar enlace de acceso"));
      const privacy = await request(`/${locale}/privacy`); assert.equal(privacy.status, 200);
      assert((await privacy.text()).includes(locale === "pt" ? "Dados que coletamos" : locale === "en" ? "Data We Collect" : "Datos que recopilamos"));
      const templates = await request(`/${locale}/templates`); assert.equal(templates.status, 200);
      assert((await templates.text()).includes(locale === "pt" ? "Biblioteca pública de modelos" : locale === "en" ? "Public template library" : "Biblioteca pública de plantillas"));
      const report = await request(`/${locale}/reports/${reportSlug}`); assert.equal(report.status, 200);
      assert((await report.text()).includes(locale === "pt" ? "Relatório de campanha do cliente" : locale === "en" ? "Client campaign report" : "Informe de campaña del cliente"));
      const scheduler = await request(`/${locale}/scheduler`, tokens[0]); assert.equal(scheduler.status, 200);
      assert((await scheduler.text()).includes(locale === "pt" ? "Agendador de conteúdo" : locale === "en" ? "Content scheduler" : "Programador de contenido"));
    }
    await prisma.workspaceMember.update({ where: { workspaceId_userId: { workspaceId: workspaces[0], userId: userIds[0] } }, data: { role: "MEMBER" } });
    assert.equal((await request("/api/admin/diagnostics", tokens[0])).status, 403);
    assert.equal((await request(`/api/leads/${contact.id}`, tokens[0], "PATCH", { status: "LOST" })).status, 403);
    console.log("HTTP smoke passed: auth, workspace isolation, role restrictions, scheduler credentials, filters and pages in three languages.");
  } finally {
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
