const SOFT_LIMIT = 1000;
const HARD_LIMIT = 1200;
const LONG_DELAY_THRESHHOLD = 5000;
const BASE_DELAY = 0.5;
const RATE_LIMIT_BARRIER = 1200;
const RAW_REQUEST_LIMIT = 6000;

export class RateLimiter {
    weight1m: number;
    weightTotal: number;
    lastUpdate: number;
    timeOffset: number;
    throttleCounter: number;
    constructor() {
        this.weight1m = 0;
        this.weightTotal = 0;
        this.lastUpdate = Date.now() / 1000;
        this.timeOffset = 0;
        this.throttleCounter = 0;
    }
    update(weight1m: number, weightTotal: number): void {
        if (this.secondsToNextFullMinute() > 55) {
            this.weight1m = 0;
            this.weightTotal = 0;
        }
        this.weight1m = Math.max(weight1m, this.weight1m);
        this.weightTotal = Math.max(weightTotal, this.weightTotal);
        this.lastUpdate = Date.now() / 1000;
    }
    shouldThrottle(): boolean {
        return this.weight1m > SOFT_LIMIT ||
            this.weightTotal > LONG_DELAY_THRESHHOLD;
    }
    chillOutBro(): [number, number] {
        const secondsLeft = this.secondsToNextFullMinute() + 0.5;
        let baseDelay = BASE_DELAY;
        let shortDelay = 0.0;
        if (this.weight1m >= SOFT_LIMIT) {
            shortDelay = baseDelay +
                (secondsLeft ** 2) /
                    (RATE_LIMIT_BARRIER - (this.weight1m - 1));
        }
        if (this.weight1m >= HARD_LIMIT) {
            shortDelay = secondsLeft < 55 ? secondsLeft : 5;
        }
        let addDelay = 0.0;
        if (this.weightTotal > LONG_DELAY_THRESHHOLD) {
            console.info(`increased total weight: ${this.weightTotal}`);
            addDelay = (this.weightTotal - LONG_DELAY_THRESHHOLD) / 50;
        }
        if (this.weightTotal > RAW_REQUEST_LIMIT * 0.95) {
            console.warn("approaching 5m limit ... increasing delay");
            baseDelay = 10;
        }
        this.throttleCounter++;
        return [shortDelay + addDelay, this.throttleCounter];
    }
    secondsToNextFullMinute(): number {
        const adjusted = new Date(Date.now() + this.timeOffset * 1000);
        return 60 - adjusted.getSeconds();
    }
}
