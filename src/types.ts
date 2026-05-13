export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'half-won' | 'half-lost';
export type BetType   = 'single' | 'parlay';
export type Tab = 'dashboard' | 'bets' | 'analytics';
export type TransactionType = 'deposit' | 'withdrawal';

export interface ParlayLeg {
  match:     string;
  league:    string;
  selection: string;
  odds:      number;
  status:    BetStatus;
}

export interface Transaction {
  id:        string;
  createdAt: string;
  date:      string;
  type:      TransactionType;
  amount:    number;
  notes?:    string;
}

export interface Bet {
  id:        string;
  createdAt: string;
  matchDate: string;
  match:     string;
  league:    string;
  market:    string;
  selection: string;
  odds:      number;     // for parlays: raw product of all leg odds
  stake:     number;
  status:    BetStatus;  // for parlays: kept in sync with deriveParlayStatus
  betType:   BetType;
  legs?:     ParlayLeg[];
  notes?:    string;
}
