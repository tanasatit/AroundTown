export interface CollectionCalculations {
  machineTotal: number;
  exchangeTotal: number;
  postcardsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  exchangeBalanced: boolean;
}

export function calculateCollectionMetrics(collection: {
  machineCoins10baht: number;
  exchangeCoins1baht: number;
  exchangeCoins2baht: number;
  exchangeCoins5baht: number;
  exchangeCoins10baht: number;
  exchangeNote20baht: number;
  exchangeNote50baht: number;
  exchangeNote100baht: number;
  exchangeNote500baht: number;
  exchangeNote1000baht: number;
  costPerPostcard: number | any;
}): CollectionCalculations {
  const machineTotal = collection.machineCoins10baht * 10;
  
  const exchangeTotal = 
    (collection.exchangeCoins1baht * 1) +
    (collection.exchangeCoins2baht * 2) +
    (collection.exchangeCoins5baht * 5) +
    (collection.exchangeCoins10baht * 10) +
    (collection.exchangeNote20baht * 20) +
    (collection.exchangeNote50baht * 50) +
    (collection.exchangeNote100baht * 100) +
    (collection.exchangeNote500baht * 500) +
    (collection.exchangeNote1000baht * 1000);
  
  const postcardsSold = Math.floor(collection.machineCoins10baht / 4);
  const revenue = postcardsSold * 40;
  const cost = postcardsSold * Number(collection.costPerPostcard);
  const profit = revenue - cost;
  const exchangeBalanced = Math.abs(exchangeTotal - 12000) < 1;
  
  return {
    machineTotal,
    exchangeTotal,
    postcardsSold,
    revenue,
    cost,
    profit,
    exchangeBalanced
  };
}

export function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
}