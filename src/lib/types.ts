// src/lib/types.ts
export type Category =
  | 'accommodation'
  | 'food'
  | 'transport'
  | 'activities'
  | 'shopping'
  | 'health'
  | 'other';

export type Expense = {
  id: string;
  amount: number;
  currency: string;
  amountHome: number;
  amountUSD: number;
  category: Category;
  note: string;
  date: string;
  country: string;
};

export type Trip = {
  id: string;
  name: string;
  homeCurrency: string;
  dailyBudgetHome: number;
  startDate: string;
  expenses: Expense[];
};