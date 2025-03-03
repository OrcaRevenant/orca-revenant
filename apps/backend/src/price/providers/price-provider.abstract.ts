import { HistoricalPrice, Resolution } from "../price.abstract";

export interface PriceProviderConfig {
    name: string;

    priority: number;

    includes: string[] | "*";

    excludes?: string[] | null;
}

export abstract class PriceProviderAbstract {
    protected config: PriceProviderConfig;

    constructor(config: PriceProviderConfig) {
        this.config = {
            excludes: null,
            ...config,
        };
    }

    /**
     * Returns the name of this price provider
     */
    getName(): string {
        return this.config.name;
    }

    /**
     * Returns the priority of this provider
     */
    getPriority(): number {
        return this.config.priority;
    }

    /**
     * Returns the assets this provider supports
     */
    getIncludes(): string[] | "*" {
        return this.config.includes;
    }

    /**
     * Returns assets explicitly not supported by this provider
     */
    getExcludes(): string[] | null {
        return this.config.excludes || null;
    }

    /**
     * Determines if this provider supports a specific asset
     *
     * @param asset - The asset identifier to check
     * @returns boolean indicating whether the asset is supported
     */
    supports(asset: string): boolean {
        const includes = this.getIncludes();
        const excludes = this.getExcludes();

        if (excludes && excludes.includes(asset)) {
            return false;
        }

        return includes === "*" || includes.includes(asset);
    }

    /**
     * Fetches historical price data for a specified asset and time range
     *
     * @param asset - The asset identifier (e.g., "BTC", "AAPL")
     * @param from - Start date for the data range
     * @param to - End date for the data range
     * @param resolution - Data resolution/interval
     * @returns Promise with the price data response
     */
    abstract getHistoricalPrice(
        asset: string,
        from: Date,
        to: Date,
        resolution: Resolution,
    ): Promise<HistoricalPrice[]>;
}
