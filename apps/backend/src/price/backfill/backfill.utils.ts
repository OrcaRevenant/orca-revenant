import dayjs from "dayjs";
import { HistoricalPrice } from "../price.abstract";
import * as fs from "fs";
import * as csv from "fast-csv";

const storagePath = `./data/`;

export function findLowerBound(
  arr: HistoricalPrice[],
  target: dayjs.Dayjs,
): number {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const midDate = dayjs(arr[mid].time);
    if (midDate.isBefore(target)) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

export function findUpperBound(
  arr: HistoricalPrice[],
  target: dayjs.Dayjs,
): number {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const midDate = dayjs(arr[mid].time);
    if (midDate.isAfter(target)) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo;
}

export function readFromStorage(asset: string): Promise<HistoricalPrice[]> {
  return new Promise((resolve) => {
    const filePath = `${storagePath}/${asset}_historical_price_data.csv`;
    const results: HistoricalPrice[] = [];

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        if (err.code === "ENOENT") {
          console.warn(
            `CSV file not found for ${asset}, returning empty dataset.`,
          );
          return resolve([]);
        }
        console.error(`Error accessing CSV file: ${err.message}`);
        return resolve([]);
      }

      fs.createReadStream(filePath)
        .pipe(csv.parse({ headers: true, ignoreEmpty: true }))
        .on("error", (error) => {
          console.error(`Error reading CSV file: ${error.message}`);
          resolve([]);
        })
        .on("data", (row) => results.push(row))
        .on("end", () => resolve(results));
    });
  });
}

export function writeToStorage(
  asset: string,
  data: HistoricalPrice[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const filePath = `${storagePath}/${asset}_historical_price.csv`;

    fs.mkdir(storagePath, { recursive: true }, (err) => {
      if (err) {
        console.error(`Failed to create storage directory: ${err.message}`);
        return reject(err);
      }

      const ws = fs.createWriteStream(filePath);
      csv
        .write(data, { headers: true })
        .pipe(ws)
        .on("finish", () => resolve())
        .on("error", (error) => {
          console.error(`Error writing to CSV file: ${error.message}`);
          reject(error);
        });
    });
  });
}
