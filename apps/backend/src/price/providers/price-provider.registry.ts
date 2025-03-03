import { Injectable } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core/discovery";
import { PriceProviderAbstract } from "./price-provider.abstract";
import { PRICE_PROVIDER } from "./price-provider.constant";

@Injectable()
export class PriceProviderRegistry {
    private providers: Map<string, PriceProviderAbstract> = new Map();
    private providerList: PriceProviderAbstract[] = [];

    constructor(
        private readonly discoveryService: DiscoveryService,
    ) {
    }

    async init() {
        const providerWrappers = this.discoveryService.getProviders();

        const priceProviders = providerWrappers.filter((wrapper) =>
            wrapper.token === PRICE_PROVIDER && wrapper.instance
        );

        for (const providerWrapper of priceProviders) {
            try {
                const providerInstance = providerWrapper
                    .instance as PriceProviderAbstract;

                const providerName = providerInstance.getName();
                this.register(providerName, providerInstance);

                console.log(
                    `Discovered and registered provider: ${providerName} with priority: ${providerInstance.getPriority()}`,
                );
            } catch (error) {
                console.error("Error registering provider:", error);
            }
        }

        console.log(`Total providers registered: ${this.providers.size}`);
    }

    register(name: string, provider: PriceProviderAbstract): void {
        console.log(`Registering provider: ${name}`);
        this.providers.set(name, provider);
        this.updateProviderList();
    }

    getProvider(asset: string): PriceProviderAbstract | null {
        const supportingProviders = this.providerList
            .filter((provider) => {
                try {
                    const supports = provider.supports(asset);

                    return supports;
                } catch {
                    return false;
                }
            })
            .sort((a, b) => a.getPriority() - b.getPriority());

        if (supportingProviders.length === 0) {
            console.warn(`No provider found for asset ${asset}`);
            return null;
        }

        const selectedProvider = supportingProviders[0];
        console.log(
            `Selected provider for ${asset}: ${selectedProvider.getName()} (priority: ${selectedProvider.getPriority()})`,
        );

        return selectedProvider;
    }

    getAllProviders(): PriceProviderAbstract[] {
        return [...this.providerList];
    }

    private updateProviderList(): void {
        this.providerList = [...this.providers.values()];
    }
}
