import { HistoricalPrice, Resolution } from "./price.abstract";

export function getCronExpression(interval: number): string {
  if (interval >= 1) {
    throw new Error("Interval must be greater or equal to 1");
  }

  const seconds = Math.floor((interval % 1) * 60);
  const minutes = Math.floor(interval) % 60;
  const hours = Math.floor(interval / 60);

  return `${seconds} ${minutes} ${hours} * * *`;
}

/**
 * Aggregates 1-minute interval prices into a larger time interval while preserving the last price.
 *
 * @param prices - Array of 1-minute interval prices (sorted from oldest to newest).
 * @param resolution - The desired interval in minutes (e.g., 2, 3, 5, etc.).
 * @returns Aggregated prices with consistent new intervals.
 */
export function aggregatePriceData(
  prices: HistoricalPrice[],
  resolution: Resolution,
): HistoricalPrice[] {
  if (prices.length === 0) return [];

  const aggregated: HistoricalPrice[] = [];
  let lastSelectedTime = new Date(prices[prices.length - 1].time);

  aggregated.push(prices[prices.length - 1]);

  for (let i = prices.length - 2; i >= 0; i--) {
    const currentTime = new Date(prices[i].time);

    if (
      (lastSelectedTime.getTime() - currentTime.getTime()) / 60000 >=
        resolution
    ) {
      aggregated.push(prices[i]);
      lastSelectedTime = currentTime;
    }
  }

  return aggregated.reverse();
}
