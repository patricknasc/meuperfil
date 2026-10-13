import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createSingleMediaContainer,
  createCarouselContainer,
  publishContainer,
  publishToInstagram,
} from "@/lib/meta/publisher";

describe("Meta Content Publisher", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("creates single photo container with correct endpoint and parameters", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "container_123" }),
    });

    const containerId = await createSingleMediaContainer("ig_user_1", "test_token", {
      mediaUrl: "https://example.com/photo.jpg",
      mediaType: "IMAGE",
      caption: "Legenda de teste",
    });

    expect(containerId).toBe("container_123");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/ig_user_1/media?"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("creates carousel container referencing child items", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "carousel_container_999" }),
    });

    const carouselId = await createCarouselContainer(
      "ig_user_1",
      "test_token",
      ["c1", "c2", "c3"],
      "Carrossel incrível"
    );

    expect(carouselId).toBe("carousel_container_999");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("media_type=CAROUSEL"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("publishes container and returns published media ID", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ig_post_888" }),
    });

    const publishedId = await publishContainer("ig_user_1", "test_token", "container_123");
    expect(publishedId).toBe("ig_post_888");
  });

  it("executes complete flow for single image post", async () => {
    global.fetch = vi
      .fn()
      // 1. Create container
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "cont_1" }),
      })
      // 2. Poll container status
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "cont_1", status_code: "FINISHED" }),
      })
      // 3. Publish container
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "published_media_100" }),
      })
      // 4. Fetch permalink
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "published_media_100",
          permalink: "https://www.instagram.com/p/Cxyz123/",
        }),
      });

    const result = await publishToInstagram("ig_1", "token", {
      mediaUrls: ["https://example.com/img.jpg"],
      mediaType: "IMAGE",
      caption: "Publicando!",
    });

    expect(result.mediaId).toBe("published_media_100");
    expect(result.permalink).toBe("https://www.instagram.com/p/Cxyz123/");
  });
});
