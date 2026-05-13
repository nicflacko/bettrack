import { leagueStats } from '../utils';
import { Bet } from '../types';

interface Props { bets: Bet[] }

export const LeagueTable = ({ bets }: Props) => {
  const rows = leagueStats(bets);

  if (!rows.length) {
    return (
      <div className="bg-white rounded-2xl border border-black/[0.04] shadow-card p-8 text-center">
        <p className="text-sm text-gray-400">No settled bets to analyse yet.</p>
      </div>
    );
  }

  const hasLegs = rows.some(r => r.legTotal > 0 || r.legPending > 0);

  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Performance by League</h3>
        {hasLegs && (
          <span className="text-[10px] text-gray-400 font-medium">P&amp;L &amp; ROI reflect singles only</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left pl-5">League</th>
              <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">W</th>
              <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">L</th>
              <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Win%</th>
              {hasLegs && (
                <th className="py-3 text-[10px] font-bold text-purple-300 uppercase tracking-widest text-right pr-4">Legs</th>
              )}
              <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">P&amp;L</th>
              <th className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right pr-5">ROI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const legWinRate = r.legTotal > 0 ? Math.round((r.legWon / r.legTotal) * 100) : null;
              return (
                <tr key={r.league} className={`hover:bg-gray-50/60 transition-colors ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <td className="pl-5 pr-3 py-3.5 text-sm font-semibold text-gray-700">{r.league}</td>

                  <td className="px-3 py-3.5 text-right text-sm font-semibold text-[#34C759]">{r.won}</td>
                  <td className="px-3 py-3.5 text-right text-sm font-semibold text-[#FF3B30]">{r.lost}</td>

                  <td className="px-3 py-3.5 text-right">
                    {r.total > 0 ? (
                      <span className={`text-sm font-bold ${r.winRate >= 50 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                        {r.winRate.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {hasLegs && (
                    <td className="px-3 py-3.5 text-right">
                      {r.legTotal > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                          <span className="text-purple-400">⊞</span>
                          <span className="text-green-600">{r.legWon}W</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-red-500">{r.legLost}L</span>
                          {legWinRate !== null && (
                            <span className="text-purple-400 ml-0.5">{legWinRate}%</span>
                          )}
                        </span>
                      ) : r.legPending > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-400 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                          <span>⊞</span>
                          <span>{r.legPending} pending</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-200">—</span>
                      )}
                    </td>
                  )}

                  <td className="px-3 py-3.5 text-right">
                    {r.total > 0 ? (
                      <span className={`text-sm font-bold ${r.profit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                        {r.profit >= 0 ? '+' : ''}${r.profit.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="pl-3 pr-5 py-3.5 text-right">
                    {r.total > 0 ? (
                      <span className={`text-sm font-bold ${r.roi >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                        {r.roi >= 0 ? '+' : ''}{r.roi.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
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
