import Redis from "ioredis";

// In-Memory L1 Cache
class MemoryCache {
    constructor(defaultTtlSeconds = 45) {
        this.cache = new Map();
        this.defaultTtl = defaultTtlSeconds * 1000;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }

    set(key, value, ttlSeconds) {
        if (this.cache.size > 500) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }
        const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTtl;
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttl,
        });
    }

    del(key) {
        this.cache.delete(key);
    }

    delPrefix(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    clear() {
        this.cache.clear();
    }
}

class HybridCache {
    constructor() {
        this.memory = new MemoryCache(45);
        this.redis = null;
        this.redisConnected = false;
        this.initRedis();
    }

    initRedis() {
        try {
            const redisUrl = process.env.REDIS_URL;
            const host = process.env.REDIS_HOST || "127.0.0.1";
            const port = Number(process.env.REDIS_PORT) || 6379;
            const password = process.env.REDIS_PASSWORD || undefined;

            this.redis = redisUrl
                ? new Redis(redisUrl, {
                      lazyConnect: true,
                      maxRetriesPerRequest: 1,
                      connectTimeout: 1000,
                      retryStrategy: () => null,
                  })
                : new Redis({
                      host,
                      port,
                      password,
                      lazyConnect: true,
                      maxRetriesPerRequest: 1,
                      connectTimeout: 1000,
                      retryStrategy: () => null,
                  });

            this.redis
                .connect()
                .then(() => {
                    this.redisConnected = true;
                    console.log("[Cache] Redis server connected.");
                })
                .catch(() => {
                    this.redisConnected = false;
                });

            this.redis.on("error", () => {
                this.redisConnected = false;
            });
        } catch {
            this.redisConnected = false;
        }
    }

    async get(key) {
        // 1. Try L1 in-memory cache (ultra-fast: < 0.1ms)
        const memoryVal = this.memory.get(key);
        if (memoryVal !== null && memoryVal !== undefined) {
            return memoryVal;
        }

        // 2. Try Redis if connected
        if (this.redisConnected && this.redis) {
            try {
                const redisData = await this.redis.get(key);
                if (redisData) {
                    const parsed = JSON.parse(redisData);
                    this.memory.set(key, parsed, 45); // Populate L1
                    return parsed;
                }
            } catch {
                // Redis read error - graceful fallback
            }
        }

        return null;
    }

    async set(key, value, ttlSeconds = 45) {
        // 1. Set in L1 memory
        this.memory.set(key, value, ttlSeconds);

        // 2. Set in Redis if connected
        if (this.redisConnected && this.redis) {
            try {
                const serialized = JSON.stringify(value);
                await this.redis.setex(key, ttlSeconds, serialized);
            } catch {
                // Redis write error - graceful fallback
            }
        }
    }

    async del(key) {
        this.memory.del(key);
        if (this.redisConnected && this.redis) {
            try {
                await this.redis.del(key);
            } catch {
                // Ignore
            }
        }
    }

    async delPrefix(prefix) {
        this.memory.delPrefix(prefix);
        if (this.redisConnected && this.redis) {
            try {
                const stream = this.redis.scanStream({
                    match: `${prefix}*`,
                    count: 100,
                });
                stream.on("data", (keys = []) => {
                    if (keys.length) {
                        const pipeline = this.redis.pipeline();
                        keys.forEach((k) => pipeline.del(k));
                        pipeline.exec().catch(() => {});
                    }
                });
            } catch {
                // Ignore
            }
        }
    }

    async clear() {
        this.memory.clear();
        if (this.redisConnected && this.redis) {
            try {
                await this.redis.flushdb();
            } catch {
                // Ignore
            }
        }
    }
}

const globalForCache = globalThis;
if (!globalForCache.__stockpilotHybridCache) {
    globalForCache.__stockpilotHybridCache = new HybridCache();
}

const cache = globalForCache.__stockpilotHybridCache;
export { cache };
export default cache;
