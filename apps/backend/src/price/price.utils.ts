import { HistoricalPrice } from "./price.abstract";

export function getCronExpression(interval: number): string {
  if (interval >= 1) {
    throw new Error("Interval must be greater or equal to 1");
  }

  const seconds = Math.floor((interval % 1) * 60);
  const minutes = Math.floor(interval) % 60;
  const hours = Math.floor(interval / 60);

  return `${seconds} ${minutes} ${hours} * * *`;
}

export function aggregatePriceData(
  prices: HistoricalPrice[],
  resolutionMinutes: number,
): HistoricalPrice[] {
  prices.sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  if (resolutionMinutes <= 1) return prices;

  const aggregatedPrices: HistoricalPrice[] = [];
  let currentGroup: HistoricalPrice[] = [];

  for (const price of prices) {
    const priceTime = new Date(price.time);

    if (currentGroup.length === 0) {
      currentGroup.push(price);
    } else {
      const firstPriceInGroup = new Date(currentGroup[0].time);
      const minutesDifference =
        (priceTime.getTime() - firstPriceInGroup.getTime()) / (1000 * 60);

      if (minutesDifference < resolutionMinutes) {
        currentGroup.push(price);
      } else {
        if (currentGroup.length > 0) {
          const aggregatedPrice = this.calculateAggregatedPrice(currentGroup);
          aggregatedPrices.push(aggregatedPrice);
        }
        currentGroup = [price];
      }
    }
  }

  if (currentGroup.length > 0) {
    const aggregatedPrice = this.calculateAggregatedPrice(currentGroup);
    aggregatedPrices.push(aggregatedPrice);
  }

  return aggregatedPrices;
}
