import { Bet, BetStatus, ParlayLeg, Transaction } from './types';

// ── Parlay helpers ────────────────────────────────────────────────────────────

export const deriveParlayStatus = (legs: ParlayLeg[]): BetStatus => {
  if (legs.some(l => l.status === 'pending'))   return 'pending';
  if (legs.some(l => l.status === 'lost'))      return 'lost';
  if (legs.every(l => l.status === 'void'))     return 'void';
  if (legs.some(l => l.status === 'half-lost')) return 'half-lost';
  return 'won'; // all won/void, half-won legs absorbed into effective odds
};

// Void legs = 1.0, half-won = (odds+1)/2, won = full odds
export const calcParlayEffectiveOdds = (legs: ParlayLeg[]): number => {
  const result = legs.reduce((acc, leg) => {
    if (leg.status === 'void' || leg.status === 'lost' || leg.status === 'half-lost') return acc;
    if (leg.status === 'half-won') return acc * ((leg.odds + 1) / 2);
    return acc * leg.odds;
  }, 1);
  return +result.toFixed(3);
};

// Raw combined odds (all legs at face value, for display)
export const calcParlayRawOdds = (legs: ParlayLeg[]): number =>
  +legs.reduce((acc, l) => acc * l.odds, 1).toFixed(3);

// ── P&L ───────────────────────────────────────────────────────────────────────

export const calcProfit = (bet: Bet): number => {
  if (bet.betType === 'parlay' && bet.legs && bet.legs.length > 0) {
    const status = deriveParlayStatus(bet.legs);
    if (status === 'lost')      return -bet.stake;
    if (status === 'half-lost') return +(-bet.stake * 0.5).toFixed(2);
    if (status === 'void' || status === 'pending') return 0;
    // won (includes cases where some legs were half-won)
    const eff = calcParlayEffectiveOdds(bet.legs);
    return +(bet.stake * (eff - 1)).toFixed(2);
  }
  if (bet.status === 'won')       return +(bet.stake * (bet.odds - 1)).toFixed(2);
  if (bet.status === 'lost')      return -bet.stake;
  if (bet.status === 'half-won')  return +(bet.stake * (bet.odds - 1) * 0.5).toFixed(2);
  if (bet.status === 'half-lost') return +(-bet.stake * 0.5).toFixed(2);
  return 0;
};

export const calcPotentialReturn = (bet: Bet): number =>
  +(bet.stake * bet.odds).toFixed(2);

// ── Formatting ────────────────────────────────────────────────────────────────

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

// ── Bankroll history ──────────────────────────────────────────────────────────

export type ChartEventType = 'start' | 'bet' | 'deposit' | 'withdrawal';

export interface ChartPoint {
  label:     string;
  bankroll:  number;
  match:     string;
  eventType: ChartEventType;
}

const SETTLED: BetStatus[] = ['won', 'lost', 'half-won', 'half-lost'];

export const buildBankrollHistory = (
  initial: number,
  bets: Bet[],
  transactions: Transaction[],
): ChartPoint[] => {
  type Event = { ts: number; label: string; match: string; delta: number; eventType: ChartEventType };

  const events: Event[] = [
    ...bets
      .filter(b => SETTLED.includes(b.status))
      .map(b => ({
        ts:        new Date(b.createdAt).getTime(),
        label:     fmtDate(b.matchDate),
        match:     b.match,
        delta:     calcProfit(b),
        eventType: 'bet' as ChartEventType,
      })),
    ...transactions.map(t => ({
      ts:        new Date(t.createdAt).getTime(),
      label:     fmtDate(t.date),
      match:     t.notes || (t.type === 'deposit' ? 'Deposit' : 'Withdrawal'),
      delta:     t.type === 'deposit' ? t.amount : -t.amount,
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

// ── Streak ────────────────────────────────────────────────────────────────────

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

// ── Stats ─────────────────────────────────────────────────────────────────────

export const computeStats = (initial: number, bets: Bet[], transactions: Transaction[]) => {
  const settled  = bets.filter(b => SETTLED.includes(b.status));
  const won      = bets.filter(b => b.status === 'won');
  const lost     = bets.filter(b => b.status === 'lost');
  const halfWon  = bets.filter(b => b.status === 'half-won');
  const halfLost = bets.filter(b => b.status === 'half-lost');
  const pending  = bets.filter(b => b.status === 'pending');
  const voided   = bets.filter(b => b.status === 'void');

  const totalStaked      = settled.reduce((s, b) => s + b.stake, 0);
  const totalProfit      = settled.reduce((s, b) => s + calcProfit(b), 0);
  const totalDeposits    = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
  const netDeposits      = totalDeposits - totalWithdrawals;
  const bankroll         = +(initial + netDeposits + totalProfit).toFixed(2);
  const winRate          = settled.length ? ((won.length + halfWon.length * 0.5) / settled.length) * 100 : 0;
  const roi              = totalStaked ? (totalProfit / totalStaked) * 100 : 0;
  const avgOdds          = bets.length ? bets.reduce((s, b) => s + b.odds, 0) / bets.length : 0;
  const avgStake         = bets.length ? bets.reduce((s, b) => s + b.stake, 0) / bets.length : 0;
  const allWins          = [...won, ...halfWon];
  const bestWin          = allWins.length ? Math.max(...allWins.map(b => calcProfit(b))) : 0;
  const pendingExposure  = pending.reduce((s, b) => s + b.stake, 0);
  const currentStreak    = computeStreak(bets);

  // Parlay-specific
  const parlays        = bets.filter(b => b.betType === 'parlay');
  const parlaySettled  = parlays.filter(b => SETTLED.includes(b.status));
  const parlayWon      = parlays.filter(b => b.status === 'won');
  const parlayLost     = parlays.filter(b => b.status === 'lost');
  const parlayStaked   = parlaySettled.reduce((s, b) => s + b.stake, 0);
  const parlayProfit   = parlaySettled.reduce((s, b) => s + calcProfit(b), 0);
  const parlayRoi      = parlayStaked ? (parlayProfit / parlayStaked) * 100 : 0;
  const bestParlay     = parlayWon.length ? Math.max(...parlayWon.map(b => calcProfit(b))) : 0;

  return {
    bankroll, totalProfit, winRate, roi,
    avgOdds, avgStake, bestWin, pendingExposure,
    totalStaked, currentStreak, netDeposits, totalDeposits, totalWithdrawals,
    wonCount:      won.length,
    lostCount:     lost.length,
    halfWonCount:  halfWon.length,
    halfLostCount: halfLost.length,
    pendingCount:  pending.length,
    voidCount:     voided.length,
    settledCount:  settled.length,
    totalBets:     bets.length,
    // parlay
    parlayCount:     parlays.length,
    parlayWonCount:  parlayWon.length,
    parlayLostCount: parlayLost.length,
    parlayStaked,
    parlayProfit,
    parlayRoi,
    bestParlay,
  };
};

// ── League stats ──────────────────────────────────────────────────────────────

export const leagueStats = (bets: Bet[]) => {
  const map: Record<string, {
    sWon: number; sLost: number; sStake: number; sProfit: number;
    lWon: number; lLost: number; lPending: number;
  }> = {};

  const ensure = (l: string) => {
    if (!map[l]) map[l] = { sWon: 0, sLost: 0, sStake: 0, sProfit: 0, lWon: 0, lLost: 0, lPending: 0 };
  };

  for (const b of bets) {
    if (b.betType === 'parlay') {
      if (!b.legs) continue;
      for (const leg of b.legs) {
        ensure(leg.league);
        if (leg.status === 'won'  || leg.status === 'half-won')  map[leg.league].lWon++;
        else if (leg.status === 'lost' || leg.status === 'half-lost') map[leg.league].lLost++;
        else if (leg.status === 'pending') map[leg.league].lPending++;
      }
    } else {
      ensure(b.league);
      if (b.status === 'won'  || b.status === 'half-won')  { map[b.league].sWon++;  map[b.league].sStake += b.stake; map[b.league].sProfit += calcProfit(b); }
      if (b.status === 'lost' || b.status === 'half-lost') { map[b.league].sLost++; map[b.league].sStake += b.stake; map[b.league].sProfit += calcProfit(b); }
    }
  }

  return Object.entries(map)
    .map(([league, d]) => ({
      league,
      won:        d.sWon,
      lost:       d.sLost,
      total:      d.sWon + d.sLost,
      winRate:    d.sWon + d.sLost > 0 ? (d.sWon / (d.sWon + d.sLost)) * 100 : 0,
      profit:     +d.sProfit.toFixed(2),
      roi:        d.sStake > 0 ? (d.sProfit / d.sStake) * 100 : 0,
      legWon:     d.lWon,
      legLost:    d.lLost,
      legPending: d.lPending,
      legTotal:   d.lWon + d.lLost,
    }))
    .sort((a, b) => (b.total + b.legTotal) - (a.total + a.legTotal));
};
