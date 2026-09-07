export const ACCOUNT_TYPES = ['checking', 'savings', 'credit'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export function isAccountType(value: string): value is AccountType {
  return (ACCOUNT_TYPES as readonly string[]).includes(value);
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  institution: string;
  currency: string;
  createdAt: string;
}

export interface NewAccount {
  name: string | undefined;
  type: string | undefined;
  institution: string | undefined;
  currency: string | undefined;
}
