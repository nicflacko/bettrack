export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'half-won' | 'half-lost';
export type Tab = 'dashboard' | 'bets' | 'analytics';
export type TransactionType = 'deposit' | 'withdrawal';

export interface Transaction {
  id: string;
  createdAt: string;
  date: string;               // ISO date — when the movement happened
  type: TransactionType;
  amount: number;
  notes?: string;
}

export interface Bet {
  id: string;
  createdAt: string;   // ISO — when the bet was logged
  matchDate: string;   // ISO date — when the match is played
  match: string;
  league: string;
  market: string;
  selection: string;
  odds: number;        // decimal odds
  stake: number;
  status: BetStatus;
  notes?: string;
}
