import { Redis } from "https://esm.sh/@upstash/redis@1.34.0";

const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
});

export async function enqueue(queue: string, payload: any) {
  await redis.lpush(queue, JSON.stringify(payload));
}
