export const MACHINE_LOCATIONS = [
  "Rare Aroon - Ground Floor",
  "Central World - 3rd Floor",
] as const;

export type MachineLocation = (typeof MACHINE_LOCATIONS)[number];

export const EXCHANGE_DENOMINATIONS = [
  { key: "exchangeCoins1baht", label: "1฿", value: 1 },
  { key: "exchangeCoins2baht", label: "2฿", value: 2 },
  { key: "exchangeCoins5baht", label: "5฿", value: 5 },
  { key: "exchangeCoins10baht", label: "10฿", value: 10 },
  { key: "exchangeNote20baht", label: "20฿", value: 20 },
  { key: "exchangeNote50baht", label: "50฿", value: 50 },
  { key: "exchangeNote100baht", label: "100฿", value: 100 },
  { key: "exchangeNote500baht", label: "500฿", value: 500 },
  { key: "exchangeNote1000baht", label: "1000฿", value: 1000 },
] as const;

export const EXCHANGE_BALANCE_TARGET = 12000;

export const DEFAULT_COST_PER_POSTCARD = 13.766;
