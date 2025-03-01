export class CircuitBreaker {
    failures: number;
    maxFailures: number;
    resetTime: number;
    lastFailureTime: Date | null;

    constructor(maxFailures = 5, resetTime = 300) {
        this.failures = 0;
        this.maxFailures = maxFailures;
        this.resetTime = resetTime;
        this.lastFailureTime = null;
    }

    recordFailure(): void {
        const currentTime = new Date();
        if (this.lastFailureTime) {
            const elapsed = currentTime.getTime() -
                this.lastFailureTime.getTime();
            if (elapsed > this.resetTime * 1000) {
                this.failures = 0;
            }
        }
        this.failures++;
        this.lastFailureTime = currentTime;
    }
    isOpen(): boolean {
        return this.failures >= this.maxFailures;
    }
    secondsToReset(): number {
        if (this.isOpen() && this.lastFailureTime) {
            return ((this.lastFailureTime.getTime() +
                this.resetTime * 1000) - Date.now()) / 1000;
        }
        return 0;
    }
}
