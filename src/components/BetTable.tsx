import { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Bet, BetStatus } from '../types';
import { calcProfit, calcPotentialReturn } from '../utils';

interface Props {
  bets: Bet[];
  onUpdateStatus: (id: string, status: BetStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (bet: Bet) => void;
  limit?: number;
}

const STATUS: Record<BetStatus, { label: string; dot: string; pill: string; select: string }> = {
  pending:     { label: 'Pending', dot: 'bg-[#FF9F0A]', pill: 'bg-orange-50 text-orange-600', select: 'bg-orange-50 text-orange-600 border-orange-200' },
  won:         { label: 'Won',     dot: 'bg-[#34C759]', pill: 'bg-green-50  text-green-600',  select: 'bg-green-50  text-green-600  border-green-200'  },
  lost:        { label: 'Lost',    dot: 'bg-[#FF3B30]', pill: 'bg-red-50    text-red-500',    select: 'bg-red-50    text-red-500    border-red-200'    },
  'half-won':  { label: '½ Won',   dot: 'bg-yellow-400', pill: 'bg-yellow-50 text-yellow-600', select: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  'half-lost': { label: '½ Lost',  dot: 'bg-amber-400',  pill: 'bg-amber-50  text-amber-600',  select: 'bg-amber-50  text-amber-600  border-amber-200'  },
  void:        { label: 'Void',    dot: 'bg-gray-400',  pill: 'bg-gray-100  text-gray-500',   select: 'bg-gray-100  text-gray-500   border-gray-200'   },
};

const ALL_STATUSES: BetStatus[] = ['pending', 'won', 'lost', 'half-won', 'half-lost', 'void'];

const LEAGUE_COLORS: Record<string, string> = {
  'Premier League':   'bg-purple-50  text-purple-600',
  'La Liga':          'bg-orange-50  text-orange-600',
  'Serie A':          'bg-blue-50    text-blue-600',
  'Bundesliga':       'bg-red-50     text-red-600',
  'Ligue 1':          'bg-sky-50     text-sky-600',
  'Champions League': 'bg-indigo-50  text-indigo-600',
  'Europa League':    'bg-orange-50  text-orange-500',
};
const leagueColor = (league: string) =>
  LEAGUE_COLORS[league] ?? 'bg-gray-100 text-gray-500';

export const BetTable = ({ bets, onUpdateStatus, onDelete, onEdit, limit }: Props) => {
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
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
              const profit  = calcProfit(bet);
              const potRet  = calcPotentialReturn(bet);
              const settled = ['won','lost','half-won','half-lost'].includes(bet.status);
              const s       = STATUS[bet.status];

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
                    <span className="text-sm font-bold text-gray-800">{bet.odds % 1 === 0 ? bet.odds.toFixed(2) : bet.odds.toFixed(3).replace(/0$/, '')}</span>
                  </td>

                  {/* Stake */}
                  <td className="px-2 py-4 text-right pr-4">
                    <span className="text-sm text-gray-600">${bet.stake.toFixed(2)}</span>
                  </td>

                  {/* Status — dropdown */}
                  <td className="px-2 py-4 whitespace-nowrap">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setOpenStatusId(openStatusId === bet.id ? null : bet.id)}
                        className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${s.pill} hover:opacity-80`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                        <svg className="w-2.5 h-2.5 opacity-50 ml-0.5" viewBox="0 0 10 6" fill="none">
                          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {openStatusId === bet.id && (
                        <>
                          {/* Backdrop to close */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenStatusId(null)}
                          />
                          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[110px]">
                            {ALL_STATUSES.map(st => (
                              <button
                                key={st}
                                onClick={() => { onUpdateStatus(bet.id, st); setOpenStatusId(null); }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-50
                                  ${bet.status === st ? 'opacity-40 cursor-default' : ''}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS[st].dot}`} />
                                {STATUS[st].label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* P&L */}
                  <td className="px-2 py-4 text-right pr-4 whitespace-nowrap">
                    {settled ? (
                      <span className={`text-sm font-bold ${
                        bet.status === 'half-won'  ? 'text-yellow-500' :
                        bet.status === 'half-lost' ? 'text-amber-500'  :
                        profit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'
                      }`}>
                        {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300" title="Potential return">
                        ↗ ${potRet.toFixed(2)}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="pr-3 py-4 w-16">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(bet)}
                        className="text-gray-300 hover:text-[#007AFF] p-1 transition-colors"
                        title="Edit bet"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => onDelete(bet.id)}
                        className="text-gray-300 hover:text-[#FF3B30] p-1 transition-colors"
                        title="Delete bet"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
