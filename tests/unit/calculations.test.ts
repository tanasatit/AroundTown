import { describe, it, expect } from 'vitest';
import { calculateCollectionMetrics } from '@/lib/calculations';

const baseCollection = {
  machineCoins10baht: 0,
  exchangeCoins1baht: 0,
  exchangeCoins2baht: 0,
  exchangeCoins5baht: 0,
  exchangeCoins10baht: 0,
  exchangeNote20baht: 0,
  exchangeNote50baht: 0,
  exchangeNote100baht: 0,
  exchangeNote500baht: 0,
  exchangeNote1000baht: 0,
  costPerPostcard: 13.766,
};

describe('calculateCollectionMetrics', () => {
  it('calculates correctly for 200 coins', () => {
    const result = calculateCollectionMetrics({ ...baseCollection, machineCoins10baht: 200 });
    expect(result.machineTotal).toBe(2000);
    expect(result.postcardsSold).toBe(50);
    expect(result.revenue).toBe(2000);
    expect(result.cost).toBeCloseTo(688.3, 1);
    expect(result.profit).toBeCloseTo(1311.7, 1);
  });

  it('calculates correctly for 400 coins', () => {
    const result = calculateCollectionMetrics({ ...baseCollection, machineCoins10baht: 400 });
    expect(result.postcardsSold).toBe(100);
    expect(result.revenue).toBe(4000);
    expect(result.cost).toBeCloseTo(1376.6, 1);
    expect(result.profit).toBeCloseTo(2623.4, 1);
  });

  it('returns zeros for 0 coins', () => {
    const result = calculateCollectionMetrics({ ...baseCollection, machineCoins10baht: 0 });
    expect(result.postcardsSold).toBe(0);
    expect(result.revenue).toBe(0);
    expect(result.cost).toBe(0);
    expect(result.profit).toBe(0);
  });

  it('floors postcards sold (not divisible by 4)', () => {
    // 201 coins → 50.25 → floor to 50
    const result = calculateCollectionMetrics({ ...baseCollection, machineCoins10baht: 201 });
    expect(result.postcardsSold).toBe(50);
  });

  it('machineTotal = coins × 10', () => {
    const result = calculateCollectionMetrics({ ...baseCollection, machineCoins10baht: 100 });
    expect(result.machineTotal).toBe(1000);
  });

  it('profit = revenue - cost', () => {
    const result = calculateCollectionMetrics({ ...baseCollection, machineCoins10baht: 200 });
    expect(result.profit).toBeCloseTo(result.revenue - result.cost, 5);
  });

  it('uses custom costPerPostcard', () => {
    const result = calculateCollectionMetrics({ ...baseCollection, machineCoins10baht: 100, costPerPostcard: 20 });
    // 25 postcards sold, cost = 25 × 20 = 500
    expect(result.cost).toBe(500);
    expect(result.profit).toBe(1000 - 500);
  });

  it('revenue = postcardsSold × 40 (fixed price)', () => {
    const result = calculateCollectionMetrics({ ...baseCollection, machineCoins10baht: 80 });
    // 80 coins → 20 postcards → 20 × 40 = 800
    expect(result.revenue).toBe(800);
  });
});
