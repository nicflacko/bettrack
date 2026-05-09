import { Bet, BetStatus, Transaction } from './types';

export const calcProfit = (bet: Bet): number => {
  if (bet.status === 'won')       return +(bet.stake * (bet.odds - 1)).toFixed(2);
  if (bet.status === 'lost')      return -bet.stake;
  if (bet.status === 'half-won')  return +(bet.stake * (bet.odds - 1) * 0.5).toFixed(2);
  if (bet.status === 'half-lost') return +(-bet.stake * 0.5).toFixed(2);
  return 0;
};

export const calcPotentialReturn = (bet: Bet): number =>
  +(bet.stake * bet.odds).toFixed(2);

export const fmt = (n: number, showSign = false): string => {
  const sign = showSign && n > 0 ? '+' : n < 0 ? '-' : '';
  const abs = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${abs}`;
};

export const fmtPct = (n: number, showSign = false): string => {
  const sign = showSign && n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

export type ChartEventType = 'start' | 'bet' | 'deposit' | 'withdrawal';

export interface ChartPoint {
  label: string;
  bankroll: number;
  match: string;
  eventType: ChartEventType;
}

export const buildBankrollHistory = (
  initial: number,
  bets: Bet[],
  transactions: Transaction[],
): ChartPoint[] => {
  // Merge settled bets + capital transactions into a single timeline
  type Event = { ts: number; label: string; match: string; delta: number; eventType: ChartEventType };

  const SETTLED: BetStatus[] = ['won', 'lost', 'half-won', 'half-lost'];

  const events: Event[] = [
    ...bets
      .filter(b => SETTLED.includes(b.status))
      .map(b => ({
        ts: new Date(b.createdAt).getTime(),
        label: fmtDate(b.matchDate),
        match: b.match,
        delta: calcProfit(b),
        eventType: 'bet' as ChartEventType,
      })),
    ...transactions.map(t => ({
      ts: new Date(t.createdAt).getTime(),
      label: fmtDate(t.date),
      match: t.notes || (t.type === 'deposit' ? 'Deposit' : 'Withdrawal'),
      delta: t.type === 'deposit' ? t.amount : -t.amount,
      eventType: t.type as ChartEventType,
    })),
  ].sort((a, b) => a.ts - b.ts);

  const history: ChartPoint[] = [
    { label: 'Start', bankroll: initial, match: '', eventType: 'start' },
  ];

  let running = initial;
  for (const e of events) {
    running = +(running + e.delta).toFixed(2);
    history.push({ label: e.label, bankroll: running, match: e.match, eventType: e.eventType });
  }
  return history;
};

const computeStreak = (bets: Bet[]): { type: 'W' | 'L' | null; count: number } => {
  const settled = [...bets]
    .filter(b => b.status === 'won' || b.status === 'lost' || b.status === 'half-won' || b.status === 'half-lost')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!settled.length) return { type: null, count: 0 };

  const isWin = (s: BetStatus) => s === 'won' || s === 'half-won';
  const type = isWin(settled[0].status) ? 'W' : 'L';
  let count = 0;
  for (const b of settled) {
    const matches = (isWin(b.status) && type === 'W') || (!isWin(b.status) && type === 'L');
    if (matches) count++;
    else break;
  }
  return { type, count };
};

export const computeStats = (initial: number, bets: Bet[], transactions: Transaction[]) => {
  const settled  = bets.filter(b => ['won','lost','half-won','half-lost'].includes(b.status));
  const won      = bets.filter(b => b.status === 'won');
  const lost     = bets.filter(b => b.status === 'lost');
  const halfWon  = bets.filter(b => b.status === 'half-won');
  const halfLost = bets.filter(b => b.status === 'half-lost');
  const pending  = bets.filter(b => b.status === 'pending');
  const voided   = bets.filter(b => b.status === 'void');

  const totalStaked    = settled.reduce((s, b) => s + b.stake, 0);
  const totalProfit    = settled.reduce((s, b) => s + calcProfit(b), 0);
  const totalDeposits  = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
  const netDeposits    = totalDeposits - totalWithdrawals;

  const bankroll       = +(initial + netDeposits + totalProfit).toFixed(2);
  // half-won counts as 0.5 win for win rate
  const winRate        = settled.length ? ((won.length + halfWon.length * 0.5) / settled.length) * 100 : 0;
  const roi            = totalStaked ? (totalProfit / totalStaked) * 100 : 0;
  const avgOdds        = bets.length ? bets.reduce((s, b) => s + b.odds, 0) / bets.length : 0;
  const avgStake       = bets.length ? bets.reduce((s, b) => s + b.stake, 0) / bets.length : 0;
  const allWins        = [...won, ...halfWon];
  const bestWin        = allWins.length ? Math.max(...allWins.map(b => calcProfit(b))) : 0;
  const pendingExposure = pending.reduce((s, b) => s + b.stake, 0);
  const currentStreak  = computeStreak(bets);

  return {
    bankroll,
    totalProfit,
    winRate,
    roi,
    avgOdds,
    avgStake,
    bestWin,
    pendingExposure,
    totalStaked,
    currentStreak,
    netDeposits,
    totalDeposits,
    totalWithdrawals,
    wonCount:      won.length,
    lostCount:     lost.length,
    halfWonCount:  halfWon.length,
    halfLostCount: halfLost.length,
    pendingCount:  pending.length,
    voidCount:     voided.length,
    settledCount:  settled.length,
    totalBets:     bets.length,
  };
};

export const leagueStats = (bets: Bet[]) => {
  const map: Record<string, { won: number; lost: number; stake: number; profit: number }> = {};
  for (const b of bets) {
    if (!map[b.league]) map[b.league] = { won: 0, lost: 0, stake: 0, profit: 0 };
    if (b.status === 'won' || b.status === 'half-won')  { map[b.league].won++;  map[b.league].stake += b.stake; map[b.league].profit += calcProfit(b); }
    if (b.status === 'lost' || b.status === 'half-lost') { map[b.league].lost++; map[b.league].stake += b.stake; map[b.league].profit += calcProfit(b); }
  }
  return Object.entries(map)
    .map(([league, d]) => ({
      league,
      won: d.won,
      lost: d.lost,
      total: d.won + d.lost,
      winRate: d.won + d.lost > 0 ? (d.won / (d.won + d.lost)) * 100 : 0,
      profit: d.profit,
      roi: d.stake > 0 ? (d.profit / d.stake) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
};
