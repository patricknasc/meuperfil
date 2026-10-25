import { getRedisConnection } from "@/lib/queue/client";

/**
 * Fixed-window limit for public store endpoints. Fails open when Redis is
 * unavailable: losing a sale is worse than letting a few extra requests in.
 */
export async function allowRequest(key: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const redis = getRedisConnection();
    const redisKey = `rate:store:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, windowSeconds);
    return count <= max;
  } catch (error) {
    console.error("Store rate limit unavailable:", error);
    return true;
  }
}
