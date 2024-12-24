export function getCronExpression(interval: number): string {
  if (interval >= 1) {
    throw new Error("Interval must be greater or equal to 1");
  }

  const seconds = Math.floor((interval % 1) * 60);
  const minutes = Math.floor(interval) % 60;
  const hours = Math.floor(interval / 60);

  return `${seconds} ${minutes} ${hours} * * *`;
}
