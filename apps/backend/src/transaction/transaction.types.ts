export type Transaction = {
  amount: number | null;
  asset: string;
  hash: string;
  id: string;
  portfolio_id: string;
  time: string;
  type: string;
  value: number | null;
};
