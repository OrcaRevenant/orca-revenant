import { HttpService } from "@nestjs/axios";
import { CircuitBreaker } from "./circuit-breaker.class";
import { RateLimitManager } from "./rate-limit-manager.class";
import { RateLimiter } from "./rate-limiter.class";
import { Semaphore } from "./semaphore.class";
import { firstValueFrom } from "rxjs";

// TODO: convert to nest module

// move to config
const MAX_WORKERS = 5;
const MAX_RETRIES = 3;
const BASE_URL = "https://api.binance.com";
const API_ENDPOINT = "/api/v3/klines";
const KLINES_LIMIT = 1000;
const SIMULATE_429_ERRORS = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class BinanceClient {
    maxWorkers: number;
    maxRetries: number;
    timeout: number;
    rateLimiter: RateLimiter;
    circuitBreaker: CircuitBreaker;
    rateLimitManager: RateLimitManager;
    semaphore: Semaphore;
    private readonly httpService: HttpService;
    constructor(
        httpService: HttpService,
        maxWorkers?: number,
        maxRetries?: number,
        timeout = 10000,
    ) {
        this.httpService = httpService;
        this.maxWorkers = maxWorkers || MAX_WORKERS;
        this.maxRetries = maxRetries || MAX_RETRIES;
        this.timeout = timeout;
        this.rateLimiter = new RateLimiter();
        this.circuitBreaker = new CircuitBreaker();
        this.rateLimitManager = new RateLimitManager();
        this.semaphore = new Semaphore(this.maxWorkers);
    }
    async syncServerTime(): Promise<void> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${BASE_URL}/api/v3/time`, {
                    timeout: this.timeout,
                }),
            );
            const serverTime = response.data.serverTime / 1000;
            this.rateLimiter.timeOffset = serverTime - Date.now() / 1000;
        } catch (error) {
            console.error("Error syncing server time:", error);
        }
    }
    async getChunkPeriods(
        start: number,
        end: number,
        interval: string,
    ): Promise<[number, number][]> {
        const chunkSize = 1000;
        const intervalMs: { [key: string]: number } = {
            "1m": 60000,
            "3m": 180000,
            "5m": 300000,
            "15m": 900000,
            "30m": 1800000,
            "1h": 3600000,
            "2h": 7200000,
            "4h": 14400000,
            "6h": 21600000,
            "8h": 28800000,
            "12h": 43200000,
            "1d": 86400000,
            "3d": 259200000,
            "1w": 604800000,
            "1M": 2592000000,
        };
        const step = chunkSize * intervalMs[interval];
        const chunks: [number, number][] = [];
        let chunkStart = start;
        while (chunkStart < end) {
            const chunkEnd = Math.min(chunkStart + step, end);
            chunks.push([chunkStart, chunkEnd]);
            chunkStart = chunkEnd + 1;
        }
        return chunks;
    }
    async fetchOhlcvChunk(
        workerId: string,
        symbol: string,
        interval: string,
        start: number,
        end: number,
    ): Promise<any[]> {
        const params = {
            symbol,
            interval,
            startTime: start,
            endTime: end,
            limit: KLINES_LIMIT,
        };
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            let waitTime = this.rateLimitManager.getWaitTime();
            try {
                await this.semaphore.acquire();
                if (waitTime > 0) {
                    console.warn(
                        `[${workerId}] Rate limit in effect. Waiting for ${
                            Math.round(waitTime)
                        } seconds.`,
                    );
                    await sleep(waitTime * 1000);
                }
                if (this.circuitBreaker.isOpen()) {
                    console.warn(
                        "Circuit breaker is open. Waiting before retrying...",
                    );
                    await sleep(this.circuitBreaker.secondsToReset() * 1000);
                }
                let delay = 0.0, count = 0;
                if (this.rateLimiter.shouldThrottle()) {
                    [delay, count] = this.rateLimiter.chillOutBro();
                    console.info(
                        `[${workerId}] throttling ${count}: ${
                            delay.toFixed(2)
                        }`,
                    );
                    await sleep(delay * 1000);
                }
                const response = await firstValueFrom(
                    this.httpService.get(`${BASE_URL}${API_ENDPOINT}`, {
                        params,
                        timeout: this.timeout,
                    }),
                );
                let responseStatus = response.status;
                if (SIMULATE_429_ERRORS && Math.random() > 0.99) {
                    responseStatus = 429;
                }
                if (responseStatus === 429) {
                    console.warn(`[${workerId}] Hit a 429 error!`);
                    const retryAfter = SIMULATE_429_ERRORS
                        ? 10
                        : parseInt(response.headers["retry-after"] || "60", 10);
                    this.rateLimitManager.setRateLimit(retryAfter);
                    this.semaphore.release();
                    return await this.fetchOhlcvChunk(
                        workerId,
                        symbol,
                        interval,
                        start,
                        end,
                    );
                }
                if (responseStatus === 418) {
                    const retryAfter = parseInt(
                        response.headers["retry-after"] || "120",
                        10,
                    );
                    console.error(
                        `[${workerId}] We are BANNED for ${retryAfter} seconds`,
                    );
                    this.rateLimitManager.setBan(retryAfter);
                    this.semaphore.release();
                    return await this.fetchOhlcvChunk(
                        workerId,
                        symbol,
                        interval,
                        start,
                        end,
                    );
                }
                this.rateLimiter.update(
                    parseInt(
                        response.headers["x-mbx-used-weight-1m"] || "0",
                        10,
                    ),
                    parseInt(response.headers["x-mbx-used-weight"] || "0", 10),
                );
                console.info(
                    `[${workerId}] Request successful. Weight: ${this.rateLimiter.weight1m}-${this.rateLimiter.weightTotal}`,
                );
                this.semaphore.release();
                return response.data;
            } catch (error: any) {
                this.semaphore.release();
                if (error.code === "ECONNABORTED") {
                    console.warn(
                        `[${workerId}] Request timed out. Retrying...`,
                    );
                    this.circuitBreaker.recordFailure();
                    if (attempt === this.maxRetries - 1) throw error;
                } else {
                    console.error(
                        `[${workerId}] Error: ${error} for ${symbol}. Retrying...`,
                    );
                    this.circuitBreaker.recordFailure();
                    if (attempt === this.maxRetries - 1) throw error;
                    waitTime = Math.pow(2, attempt) + Math.random();
                    await sleep(waitTime * 1000);
                }
            }
        }
        console.warn(
            `no result for ${symbol} after retrying ${this.maxRetries} times`,
        );
        return [];
    }

    async getOhlcv(
        symbol: string,
        interval: string,
        start: number,
        end: number,
    ): Promise<any[]> {
        const pegged = [`usdt`, `usdc`];

        if (pegged.includes(symbol.replace(`usdt`, ``).toLowerCase())) {
            const results: any[] = [];
            const chunks = await this.getChunkPeriods(start, end, interval);
            for (const [chunkStart] of chunks) {
                results.push([chunkStart, 1, 1, 1, 1, 1]); // peg to 1 dollar
            }
            return results;
        }

        const chunks = await this.getChunkPeriods(start, end, interval);
        let progress = 0;
        const total = chunks.length;
        const tasks = chunks.map((chunk, i) => {
            const [chunkStart, chunkEnd] = chunk;
            return this.fetchOhlcvChunk(
                `${symbol}_${i}`,
                symbol,
                interval,
                chunkStart,
                chunkEnd,
            )
                .then((result) => {
                    progress++;
                    console.log(
                        `${symbol} progress: ${progress}/${total} (${
                            ((progress / total) * 100).toFixed(2)
                        }%)`,
                    );
                    return result;
                });
        });
        let results: any[] = [];
        try {
            const responses = await Promise.all(tasks);
            responses.forEach((result, i) => {
                if (result instanceof Error) {
                    console.error(`Error in chunk ${i} for ${symbol}:`, result);
                } else {
                    results = results.concat(result);
                }
            });
        } catch (e) {
            console.error(`Error fetching OHLCV for ${symbol}:`, e);
        }
        results.sort((a, b) => a[0] - b[0]);
        return results;
    }

    async getTickerPrice(symbols: string[]): Promise<{
        symbol: string;
        price: string;
    }[]> {
        const url = `${BASE_URL}/api/v3/ticker/price`;
        const params = { symbols: JSON.stringify(symbols) };
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                await this.semaphore.acquire();
                const response = await firstValueFrom(
                    this.httpService.get(url, {
                        params,
                        timeout: this.timeout,
                    }),
                );
                this.semaphore.release();
                return response.data;
            } catch (error) {
                this.semaphore.release();
                console.error(
                    `Error fetching ticker price for ${
                        symbols.join(`, `)
                    } (attempt ${attempt + 1}):`,
                    error,
                );
                if (attempt === this.maxRetries - 1) {
                    throw error;
                }
                await sleep(1000); // simple retry delay
            }
        }
        throw new Error(
            `Unable to fetch ticker price for symbol: ${symbols.join(`, `)}`,
        );
    }
}
