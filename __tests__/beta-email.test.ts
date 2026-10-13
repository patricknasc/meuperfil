import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendBetaWelcomeEmail } from "../lib/beta/email";

describe("beta welcome email", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
  });

  it("sends a welcome email for a valid beta signup", async () => {
    process.env.RESEND_API_KEY = "re_test_123";
    process.env.EMAIL_FROM = "MeuPerfil <login@meuperfil.me>";

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_123" }),
    });
    global.fetch = fetchSpy as typeof fetch;

    await expect(
      sendBetaWelcomeEmail({
        name: "Ana Silva",
        email: "ana@studio.com",
        company: "Studio North",
        goal: "Launch waitlist",
      })
    ).resolves.toBe(true);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test_123",
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("silently skips email when API key is missing", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as typeof fetch;

    await expect(
      sendBetaWelcomeEmail({
        name: "Bruno",
        email: "bruno@studio.com",
      })
    ).resolves.toBe(false);

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
