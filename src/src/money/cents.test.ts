import { describe, expect, it } from 'vitest';
import { addCents, negateCents, subtractCents, toCents } from './cents.js';

describe('toCents', () => {
  it('constructs from an integer', () => {
    expect(toCents(1050)).toBe(1050);
    expect(toCents(0)).toBe(0);
    expect(toCents(-25)).toBe(-25);
  });

  it('rejects non-integer input', () => {
    expect(() => toCents(10.5)).toThrow(TypeError);
    expect(() => toCents(Number.NaN)).toThrow(TypeError);
  });
});

describe('arithmetic helpers', () => {
  it('adds, subtracts, and negates without leaving the integer domain', () => {
    const a = toCents(500);
    const b = toCents(150);
    expect(addCents(a, b)).toBe(650);
    expect(subtractCents(a, b)).toBe(350);
    expect(negateCents(a)).toBe(-500);
  });
});
