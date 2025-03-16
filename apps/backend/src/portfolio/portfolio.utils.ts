import { Timeframe } from "./portfolio.types";

export function calculateDateRange(range: Timeframe): {
  startDate: Date;
  endDate: Date;
  resolution: string;
} {
  const endDate = new Date();
  let startDate: Date;
  let resolution: string;

  switch (range) {
    case "daily":
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 1);
      resolution = "2 minutes";
      break;
    case "weekly":
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 7);
      resolution = "30 minutes";
      break;
    case "monthly":
      startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 1);
      resolution = "1 hour";
      break;
    case "yearly":
      startDate = new Date(endDate);
      startDate.setFullYear(endDate.getFullYear() - 1);
      resolution = "1 day";
      break;
    default:
      throw new Error(`Invalid range: ${range}`);
  }

  return { startDate, endDate, resolution };
}
