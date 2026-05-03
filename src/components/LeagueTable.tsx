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

  return (
    <div className="bg-white rounded-2xl border border-black/[0.04] shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-900">Performance by League</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-gray-50">
              {['League', 'Bets', 'W', 'L', 'Win %', 'P&L', 'ROI'].map(h => (
                <th key={h} className={`py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest
                  ${h === 'League' ? 'text-left pl-5' : 'text-right pr-5'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.league} className={`hover:bg-gray-50/60 transition-colors ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <td className="pl-5 pr-3 py-3.5 text-sm font-semibold text-gray-700">{r.league}</td>
                <td className="px-3 py-3.5 text-right text-sm text-gray-500">{r.total}</td>
                <td className="px-3 py-3.5 text-right text-sm font-semibold text-[#34C759]">{r.won}</td>
                <td className="px-3 py-3.5 text-right text-sm font-semibold text-[#FF3B30]">{r.lost}</td>
                <td className="px-3 py-3.5 text-right">
                  <span className={`text-sm font-bold ${r.winRate >= 50 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {r.winRate.toFixed(0)}%
                  </span>
                </td>
                <td className="px-3 py-3.5 text-right">
                  <span className={`text-sm font-bold ${r.profit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {r.profit >= 0 ? '+' : ''}${r.profit.toFixed(2)}
                  </span>
                </td>
                <td className="pl-3 pr-5 py-3.5 text-right">
                  <span className={`text-sm font-bold ${r.roi >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {r.roi >= 0 ? '+' : ''}{r.roi.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
