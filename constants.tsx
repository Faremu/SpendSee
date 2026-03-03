
import React from 'react';
import { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', icon: '🍔', color: '#FFB3BA' }, // Pastel Red
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#BAE1FF' }, // Pastel Blue (Vibrant)
  { id: 'rent', name: 'Rent', icon: '🏠', color: '#FFFFBA' }, // Pastel Yellow
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#D1BAFF' }, // Pastel Indigo
  { id: 'entertainment', name: 'Fun', icon: '🎮', color: '#FFDFBA' }, // Pastel Orange
  { id: 'health', name: 'Health', icon: '🏥', color: '#BAFFC9' }, // Pastel Green
  { id: 'salary', name: 'Salary', icon: '💵', color: '#B2F2BB' }, // Pastel Mint
  { id: 'bonus', name: 'Bonus', icon: '🎁', color: '#FFB3E6' }, // Pastel Pink
  { id: 'stock', name: 'Stocks', icon: '📈', color: '#A5F3FC' }, // Pastel Cyan
  { id: 'crypto', name: 'Crypto', icon: '₿', color: '#FBCFE8' }, // Pastel Rose
];

export const INITIAL_RULES = [
  { id: '1', name: 'S&P 500 DCA', type: 'percent', value: 15, target: 'Stock Market', active: true },
  { id: '2', name: 'Emergency Fund', type: 'fixed', value: 500, target: 'Savings', active: true },
] as const;
