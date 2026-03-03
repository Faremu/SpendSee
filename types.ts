
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  INVESTMENT = 'INVESTMENT'
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  categoryIcon: string; // URL or Emoji
  color?: string;
  note: string;
  date: number; // timestamp
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface DCARule {
  id: string;
  name: string;
  type: 'fixed' | 'percent';
  value: number;
  target: string;
  active: boolean;
}

export interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  totalInvested: number;
  balance: number;
}
