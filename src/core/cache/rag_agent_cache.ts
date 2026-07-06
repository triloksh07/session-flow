import { createHash } from "crypto";

interface CacheEntry {
    answer: string;
    timestamp: number;
}

class QueryCache {
    private cache = new Map<string, CacheEntry>();
    private readonly TTL = 1000 * 60 * 15; // 15-Minute Cache Window

    private generateHash(intent: string): string {
        return createHash("sha256").update(intent.trim().toLowerCase()).digest("hex");
    }

    public get(intent: string): string | null {
        const hash = this.generateHash(intent);
        const entry = this.cache.get(hash);

        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(hash); // Evict expired entry
            return null;
        }

        return entry.answer;
    }

    public set(intent: string, answer: string): void {
        const hash = this.generateHash(intent);
        this.cache.set(hash, {
            answer,
            timestamp: Date.now()
        });
    }

    public clear(): void {
        this.cache.clear();
    }
}

export const queryCache = new QueryCache();