import { useState, useCallback, useEffect } from 'react';
import { Bet, Transaction } from './types';

const BETS_KEY          = 'bt_bets_v1';
const BANKROLL_KEY      = 'bt_bankroll_v1';
const TRANSACTIONS_KEY  = 'bt_transactions_v1';

const load = <T>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
};

export const useStore = () => {
  const [bets, setBets]                 = useState<Bet[]>(() => load(BETS_KEY, []));
  const [initialBankroll, setInitialBR] = useState<number>(() => load(BANKROLL_KEY, 280));
  const [transactions, setTransactions] = useState<Transaction[]>(() => load(TRANSACTIONS_KEY, []));

  useEffect(() => { localStorage.setItem(BETS_KEY, JSON.stringify(bets)); }, [bets]);
  useEffect(() => { localStorage.setItem(BANKROLL_KEY, String(initialBankroll)); }, [initialBankroll]);
  useEffect(() => { localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions)); }, [transactions]);

  const addBet = useCallback((bet: Omit<Bet, 'id' | 'createdAt'>) => {
    setBets(prev => [
      { ...bet, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const updateBet = useCallback((id: string, updates: Partial<Omit<Bet, 'id'>>) => {
    setBets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const deleteBet = useCallback((id: string) => {
    setBets(prev => prev.filter(b => b.id !== id));
  }, []);

  const setInitialBankroll = useCallback((n: number) => setInitialBR(n), []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    setTransactions(prev => [
      { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    bets, initialBankroll, transactions,
    addBet, updateBet, deleteBet, setInitialBankroll,
    addTransaction, deleteTransaction,
  };
};
