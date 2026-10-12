import { describe, it, expect } from "vitest";
import {
  createScheduledPostSchema,
  updateScheduledPostSchema,
} from "@/lib/scheduler/validation";

describe("Post Scheduler Validation", () => {
  it("validates valid single image post", () => {
    const valid = {
      instagramAccountId: "acc_123",
      caption: "Meu primeiro post agendado no meuperfil.me! 🚀",
      mediaUrls: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"],
      mediaType: "IMAGE",
      publishNow: false,
      scheduledFor: new Date(Date.now() + 3600 * 1000).toISOString(),
    };

    const parsed = createScheduledPostSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("validates valid reel with auto-campaign", () => {
    const validReel = {
      instagramAccountId: "acc_123",
      caption: "Comente QUERO para receber o link completo no direct!",
      mediaUrls: ["https://example.com/reel.mp4"],
      mediaType: "REEL",
      publishNow: true,
      autoCampaignEnabled: true,
      autoCampaignKeywords: ["QUERO", "LINK"],
      autoCampaignDmMessage: "Aqui está o seu link: https://meuperfil.me",
    };

    const parsed = createScheduledPostSchema.safeParse(validReel);
    expect(parsed.success).toBe(true);
  });

  it("rejects auto-campaign without keywords or dm message", () => {
    const invalid = {
      instagramAccountId: "acc_123",
      mediaUrls: ["https://example.com/image.jpg"],
      mediaType: "IMAGE",
      publishNow: true,
      autoCampaignEnabled: true,
      autoCampaignKeywords: [],
      autoCampaignDmMessage: "",
    };

    const parsed = createScheduledPostSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("rejects carousel with less than 2 items", () => {
    const invalidCarousel = {
      instagramAccountId: "acc_123",
      mediaUrls: ["https://example.com/slide1.jpg"],
      mediaType: "CAROUSEL",
      publishNow: true,
    };

    const parsed = createScheduledPostSchema.safeParse(invalidCarousel);
    expect(parsed.success).toBe(false);
  });

  it("accepts valid carousel with multiple items", () => {
    const validCarousel = {
      instagramAccountId: "acc_123",
      mediaUrls: [
        "https://example.com/slide1.jpg",
        "https://example.com/slide2.jpg",
        "https://example.com/slide3.jpg",
      ],
      mediaType: "CAROUSEL",
      publishNow: true,
    };

    const parsed = createScheduledPostSchema.safeParse(validCarousel);
    expect(parsed.success).toBe(true);
  });

  it("validates partial update schema", () => {
    const update = {
      caption: "Nova legenda atualizada",
      autoCampaignEnabled: false,
    };

    const parsed = updateScheduledPostSchema.safeParse(update);
    expect(parsed.success).toBe(true);
  });
});
