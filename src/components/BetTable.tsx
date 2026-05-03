import { Trash2 } from 'lucide-react';
import { Bet, BetStatus } from '../types';
import { calcProfit, calcPotentialReturn } from '../utils';

interface Props {
  bets: Bet[];
  onUpdateStatus: (id: string, status: BetStatus) => void;
  onDelete: (id: string) => void;
  limit?: number;
}

const STATUS: Record<BetStatus, { label: string; dot: string; pill: string }> = {
  pending: { label: 'Pending', dot: 'bg-[#FF9F0A]', pill: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
  won:     { label: 'Won',     dot: 'bg-[#34C759]', pill: 'bg-green-50  text-green-600  hover:bg-green-100'  },
  lost:    { label: 'Lost',    dot: 'bg-[#FF3B30]', pill: 'bg-red-50    text-red-500    hover:bg-red-100'    },
  void:    { label: 'Void',    dot: 'bg-gray-400',  pill: 'bg-gray-100  text-gray-500   hover:bg-gray-200'   },
};

const CYCLE: BetStatus[] = ['pending', 'won', 'lost', 'void'];

const LEAGUE_COLORS: Record<string, string> = {
  'Premier League':    'bg-purple-50  text-purple-600',
  'La Liga':           'bg-orange-50  text-orange-600',
  'Serie A':           'bg-blue-50    text-blue-600',
  'Bundesliga':        'bg-red-50     text-red-600',
  'Ligue 1':           'bg-sky-50     text-sky-600',
  'Champions League':  'bg-indigo-50  text-indigo-600',
  'Europa League':     'bg-orange-50  text-orange-500',
};
const leagueColor = (league: string) =>
  LEAGUE_COLORS[league] ?? 'bg-gray-100 text-gray-500';

export const BetTable = ({ bets, onUpdateStatus, onDelete, limit }: Props) => {
  const shown = limit ? bets.slice(0, limit) : bets;

  if (!bets.length) {
    return (
      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-card p-16 text-center fade-in">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
          🎯
        </div>
        <p className="text-sm font-semibold text-gray-600 mb-1">No bets yet</p>
        <p className="text-xs text-gray-400">Add your first bet to start tracking your P&L</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-card overflow-hidden fade-in">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[740px]">
          <thead>
            <tr className="border-b border-gray-50">
              {['Date', 'Match / Selection', 'League', 'Market', 'Odds', 'Stake', 'Status', 'P&L', ''].map(h => (
                <th
                  key={h}
                  className={`py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap
                    ${h === 'Odds' || h === 'Stake' || h === 'P&L' ? 'text-right pr-4' : 'text-left pl-4'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((bet, i) => {
              const profit   = calcProfit(bet);
              const potRet   = calcPotentialReturn(bet);
              const settled  = bet.status === 'won' || bet.status === 'lost';
              const s        = STATUS[bet.status];
              const nextStatus = CYCLE[(CYCLE.indexOf(bet.status) + 1) % CYCLE.length];

              return (
                <tr
                  key={bet.id}
                  className={`group transition-colors hover:bg-gray-50/70 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                >
                  {/* Date */}
                  <td className="pl-4 pr-2 py-4 whitespace-nowrap">
                    <span className="text-xs text-gray-400">
                      {new Date(bet.matchDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </td>

                  {/* Match + selection */}
                  <td className="px-2 py-4 min-w-[180px]">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{bet.match}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{bet.selection}</p>
                    {bet.notes && (
                      <p className="text-[10px] text-gray-300 mt-0.5 italic truncate max-w-[200px]">{bet.notes}</p>
                    )}
                  </td>

                  {/* League */}
                  <td className="px-2 py-4 whitespace-nowrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${leagueColor(bet.league)}`}>
                      {bet.league}
                    </span>
                  </td>

                  {/* Market */}
                  <td className="px-2 py-4">
                    <span className="text-xs text-gray-400 whitespace-nowrap">{bet.market}</span>
                  </td>

                  {/* Odds */}
                  <td className="px-2 py-4 text-right pr-4">
                    <span className="text-sm font-bold text-gray-800">{bet.odds.toFixed(2)}</span>
                  </td>

                  {/* Stake */}
                  <td className="px-2 py-4 text-right pr-4">
                    <span className="text-sm text-gray-600">${bet.stake.toFixed(2)}</span>
                  </td>

                  {/* Status — click to cycle */}
                  <td className="px-2 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onUpdateStatus(bet.id, nextStatus)}
                      title={`Click to mark as ${nextStatus}`}
                      className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${s.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </button>
                  </td>

                  {/* P&L */}
                  <td className="px-2 py-4 text-right pr-4 whitespace-nowrap">
                    {settled ? (
                      <span className={`text-sm font-bold ${profit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                        {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300" title="Potential return">
                        ↗ ${potRet.toFixed(2)}
                      </span>
                    )}
                  </td>

                  {/* Delete */}
                  <td className="pr-3 py-4 w-8">
                    <button
                      onClick={() => onDelete(bet.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-[#FF3B30] p-1"
                      title="Delete bet"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
