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

describe('exchange box balance', () => {
  it('is balanced when total equals 12,000', () => {
    // 12 × 1000-baht notes = 12,000
    const result = calculateCollectionMetrics({ ...baseCollection, exchangeNote1000baht: 12 });
    expect(result.exchangeTotal).toBe(12000);
    expect(result.exchangeBalanced).toBe(true);
  });

  it('is unbalanced when total is less than 12,000', () => {
    // 11 × 1000 = 11,000
    const result = calculateCollectionMetrics({ ...baseCollection, exchangeNote1000baht: 11 });
    expect(result.exchangeBalanced).toBe(false);
  });

  it('is unbalanced when total is more than 12,000', () => {
    // 13 × 1000 = 13,000
    const result = calculateCollectionMetrics({ ...baseCollection, exchangeNote1000baht: 13 });
    expect(result.exchangeBalanced).toBe(false);
  });

  it('sums all denominations correctly', () => {
    const result = calculateCollectionMetrics({
      ...baseCollection,
      exchangeCoins1baht: 10,    // 10
      exchangeCoins2baht: 5,     // 10
      exchangeCoins5baht: 4,     // 20
      exchangeCoins10baht: 50,   // 500
      exchangeNote20baht: 10,    // 200
      exchangeNote50baht: 10,    // 500
      exchangeNote100baht: 10,   // 1000
      exchangeNote500baht: 10,   // 5000
      exchangeNote1000baht: 4,   // 4000
    });
    // 10+10+20+500+200+500+1000+5000+4000 = 11,240
    expect(result.exchangeTotal).toBe(11240);
    expect(result.exchangeBalanced).toBe(false);
  });

  it('balanced with a real-world mix totalling 12,000', () => {
    const result = calculateCollectionMetrics({
      ...baseCollection,
      exchangeCoins10baht: 100,  // 1000
      exchangeNote100baht: 10,   // 1000
      exchangeNote500baht: 10,   // 5000
      exchangeNote1000baht: 5,   // 5000
    });
    // 1000 + 1000 + 5000 + 5000 = 12,000
    expect(result.exchangeTotal).toBe(12000);
    expect(result.exchangeBalanced).toBe(true);
  });

  it('includes exchangeTransfer in total', () => {
    const result = calculateCollectionMetrics({
      ...baseCollection,
      exchangeNote1000baht: 11, // 11,000
      exchangeTransfer: 1000,   // +1,000
    });
    expect(result.exchangeTotal).toBe(12000);
    expect(result.exchangeBalanced).toBe(true);
  });

  it('treats missing exchangeTransfer as 0', () => {
    // baseCollection has no exchangeTransfer field — should default to 0
    const result = calculateCollectionMetrics({ ...baseCollection, exchangeNote1000baht: 12 });
    expect(result.exchangeTotal).toBe(12000);
    expect(result.exchangeBalanced).toBe(true);
  });
});
