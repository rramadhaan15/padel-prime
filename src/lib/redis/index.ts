import Redis from "ioredis";

// In-Memory store for locks and keys when Redis server is offline or in testing
interface MemoryLock {
  token: string;
  expiresAt: number;
}

class InMemoryRedisStore {
  private locks: Map<string, MemoryLock> = new Map();
  private data: Map<string, { value: string; expiresAt?: number }> = new Map();

  public async setLock(key: string, token: string, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const existing = this.locks.get(key);
    if (existing && existing.expiresAt > now) {
      return false; // Lock is currently held by someone else
    }
    this.locks.set(key, { token, expiresAt: now + ttlMs });
    return true;
  }

  public async releaseLock(key: string, token: string): Promise<boolean> {
    const existing = this.locks.get(key);
    if (!existing) return false;
    if (existing.token === token) {
      this.locks.delete(key);
      return true;
    }
    return false;
  }

  public async getLock(key: string): Promise<string | null> {
    const now = Date.now();
    const existing = this.locks.get(key);
    if (!existing || existing.expiresAt <= now) {
      this.locks.delete(key);
      return null;
    }
    return existing.token;
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.data.set(key, { value, expiresAt });
  }

  public async get(key: string): Promise<string | null> {
    const item = this.data.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.data.delete(key);
      return null;
    }
    return item.value;
  }

  public async del(key: string): Promise<number> {
    const deleted = this.data.delete(key) || this.locks.delete(key);
    return deleted ? 1 : 0;
  }

  public clear(): void {
    this.locks.clear();
    this.data.clear();
  }
}

const memoryRedis = new InMemoryRedisStore();
let realRedisClient: Redis | null = null;

// Connect to real Redis if REDIS_URL or REDIS_HOST is explicitly provided
if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  try {
    realRedisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: () => null, // don't hang if offline
    });
    realRedisClient.on("error", () => {
      // Fallback silently to memory store on network disconnect
      realRedisClient = null;
    });
  } catch {
    realRedisClient = null;
  }
}

/**
 * Distributed Lock acquisition using Redis SET NX PX
 */
export async function acquireDistributedLock(
  resourceKey: string,
  token: string,
  ttlMs: number = 600000 // 10 minutes
): Promise<boolean> {
  const lockKey = `lock:${resourceKey}`;
  if (realRedisClient) {
    try {
      const res = await realRedisClient.set(lockKey, token, "PX", ttlMs, "NX");
      return res === "OK";
    } catch {
      // Fallback to memory
    }
  }
  return memoryRedis.setLock(lockKey, token, ttlMs);
}

/**
 * Distributed Lock release using Lua Script (or atomic token validation)
 */
export async function releaseDistributedLock(
  resourceKey: string,
  token: string
): Promise<boolean> {
  const lockKey = `lock:${resourceKey}`;
  if (realRedisClient) {
    try {
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await realRedisClient.eval(luaScript, 1, lockKey, token);
      return result === 1;
    } catch {
      // Fallback to memory
    }
  }
  return memoryRedis.releaseLock(lockKey, token);
}

export function resetRedisMemoryStore() {
  memoryRedis.clear();
}
