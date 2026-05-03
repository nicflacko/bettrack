import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { Bet, BetStatus, Transaction } from './types';

// ── DB row → app type mappers ─────────────────────────────────────────────────

const toBet = (row: any): Bet => ({
  id:        row.id,
  createdAt: row.created_at,
  matchDate: row.match_date,
  match:     row.match,
  league:    row.league,
  market:    row.market,
  selection: row.selection,
  odds:      parseFloat(row.odds),
  stake:     parseFloat(row.stake),
  status:    row.status as BetStatus,
  notes:     row.notes ?? '',
});

const toTx = (row: any): Transaction => ({
  id:        row.id,
  createdAt: row.created_at,
  date:      row.date,
  type:      row.type,
  amount:    parseFloat(row.amount),
  notes:     row.notes ?? '',
});

// ── Store hook ────────────────────────────────────────────────────────────────

export const useStore = () => {
  const [bets, setBets]                 = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [initialBankroll, setInitialBR] = useState<number>(280);
  const [loading, setLoading]           = useState(true);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [betsRes, txRes, settingsRes] = await Promise.all([
        supabase.from('bets').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('value').eq('key', 'initial_bankroll').single(),
      ]);
      if (betsRes.data)     setBets(betsRes.data.map(toBet));
      if (txRes.data)       setTransactions(txRes.data.map(toTx));
      if (settingsRes.data) setInitialBR(parseFloat(settingsRes.data.value));
      setLoading(false);
    })();
  }, []);

  // ── Real-time — one channel for all three tables ──────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('bettrack-live')
      // bets
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bets' },
        p => setBets(prev =>
          [toBet(p.new), ...prev].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        )
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bets' },
        p => setBets(prev => prev.map(b => b.id === p.new.id ? toBet(p.new) : b))
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bets' },
        p => setBets(prev => prev.filter(b => b.id !== (p.old as any).id))
      )
      // transactions
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' },
        p => setTransactions(prev => [toTx(p.new), ...prev])
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transactions' },
        p => setTransactions(prev => prev.filter(t => t.id !== (p.old as any).id))
      )
      // settings
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' },
        p => { if (p.new.key === 'initial_bankroll') setInitialBR(parseFloat(p.new.value)); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Bets CRUD ─────────────────────────────────────────────────────────────
  const addBet = useCallback(async (bet: Omit<Bet, 'id' | 'createdAt'>) => {
    await supabase.from('bets').insert({
      match_date: bet.matchDate,
      match:      bet.match,
      league:     bet.league,
      market:     bet.market,
      selection:  bet.selection,
      odds:       bet.odds,
      stake:      bet.stake,
      status:     bet.status,
      notes:      bet.notes || null,
    });
  }, []);

  const updateBet = useCallback(async (id: string, updates: Partial<Omit<Bet, 'id'>>) => {
    const db: Record<string, unknown> = {};
    if (updates.matchDate  !== undefined) db.match_date = updates.matchDate;
    if (updates.match      !== undefined) db.match      = updates.match;
    if (updates.league     !== undefined) db.league     = updates.league;
    if (updates.market     !== undefined) db.market     = updates.market;
    if (updates.selection  !== undefined) db.selection  = updates.selection;
    if (updates.odds       !== undefined) db.odds       = updates.odds;
    if (updates.stake      !== undefined) db.stake      = updates.stake;
    if (updates.status     !== undefined) db.status     = updates.status;
    if (updates.notes      !== undefined) db.notes      = updates.notes || null;
    await supabase.from('bets').update(db).eq('id', id);
  }, []);

  const deleteBet = useCallback(async (id: string) => {
    await supabase.from('bets').delete().eq('id', id);
  }, []);

  // ── Transactions CRUD ─────────────────────────────────────────────────────
  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    await supabase.from('transactions').insert({
      date:   t.date,
      type:   t.type,
      amount: t.amount,
      notes:  t.notes || null,
    });
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
  }, []);

  // ── Settings ──────────────────────────────────────────────────────────────
  const setInitialBankroll = useCallback(async (n: number) => {
    setInitialBR(n); // optimistic
    await supabase.from('settings').update({ value: String(n) }).eq('key', 'initial_bankroll');
  }, []);

  return {
    bets, transactions, initialBankroll, loading,
    addBet, updateBet, deleteBet,
    addTransaction, deleteTransaction,
    setInitialBankroll,
  };
};
