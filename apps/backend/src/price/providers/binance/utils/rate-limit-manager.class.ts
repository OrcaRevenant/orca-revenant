export class RateLimitManager {
    waitUntil: number;
    constructor() {
        this.waitUntil = 0;
    }
    getWaitTime(): number {
        const now = Date.now();
        if (now < this.waitUntil) {
            return (this.waitUntil - now) / 1000;
        }
        return 0;
    }
    setRateLimit(seconds: number): void {
        this.waitUntil = Date.now() + seconds * 1000;
    }
    setBan(seconds: number): void {
        this.waitUntil = Date.now() + seconds * 1000;
    }
}
