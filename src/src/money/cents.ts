/**
 * Money is never represented as a float anywhere in this codebase. `Cents`
 * brands a plain `number` so a bare, un-vetted number can't be passed where
 * money is expected without going through `toCents` first.
 */
export type Cents = number & { readonly __brand: 'Cents' };

export function toCents(value: number): Cents {
  if (!Number.isInteger(value)) {
    throw new TypeError(`Cents must be an integer minor-unit value, got ${value}`);
  }
  return value as Cents;
}

export function addCents(a: Cents, b: Cents): Cents {
  return toCents(a + b);
}

export function subtractCents(a: Cents, b: Cents): Cents {
  return toCents(a - b);
}

export function negateCents(a: Cents): Cents {
  return toCents(-a);
}
