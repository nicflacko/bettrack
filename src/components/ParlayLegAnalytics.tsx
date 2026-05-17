import { Bet } from '../types';

interface Props { bets: Bet[] }

const SETTLED = (s: string) => s === 'won' || s === 'lost' || s === 'half-won' || s === 'half-lost';
const WIN     = (s: string) => s === 'won' || s === 'half-won';

const winColor  = (wr: number | null) =>
  wr === null ? 'text-gray-300' : wr >= 60 ? 'text-[#34C759]' : wr >= 42 ? 'text-yellow-500' : 'text-[#FF3B30]';
const barColor  = (wr: number | null) =>
  wr === null ? 'bg-gray-100' : wr >= 60 ? 'bg-[#34C759]' : wr >= 42 ? 'bg-yellow-400' : 'bg-[#FF3B30]';
const cardBorder = (wr: number | null) =>
  wr === null ? 'border-gray-100 bg-gray-50/60'
  : wr >= 60 ? 'border-green-100 bg-green-50/60'
  : wr >= 42 ? 'border-yellow-100 bg-yellow-50/60'
  : 'border-red-100 bg-red-50/60';

const LEAGUE_COLOR: Record<string, string> = {
  'Premier League':   'bg-purple-100 text-purple-600',
  'La Liga':          'bg-orange-100 text-orange-600',
  'Serie A':          'bg-blue-100 text-blue-600',
  'Bundesliga':       'bg-red-100 text-red-600',
  'Ligue 1':          'bg-sky-100 text-sky-600',
  'Champions League': 'bg-indigo-100 text-indigo-600',
  'Europa League':    'bg-amber-100 text-amber-600',
};
const leagueDot = (l: string) => LEAGUE_COLOR[l] ?? 'bg-gray-100 text-gray-500';

const ODDS_RANGES = [
  { label: '1.01 – 1.50', min: 1.01, max: 1.50 },
  { label: '1.51 – 2.00', min: 1.51, max: 2.00 },
  { label: '2.01 – 3.00', min: 2.01, max: 3.00 },
  { label: '3.00+',       min: 3.00, max: Infinity },
];

export const ParlayLegAnalytics = ({ bets }: Props) => {
  const parlays = bets.filter(b => b.betType === 'parlay' && b.legs?.length);
  if (!parlays.length) return null;

  const allLegs    = parlays.flatMap(b => b.legs!);
  const settled    = allLegs.filter(l => SETTLED(l.status));
  const totalWon   = settled.filter(l => WIN(l.status)).length;
  const totalLost  = settled.length - totalWon;
  const pending    = allLegs.filter(l => l.status === 'pending').length;
  const overallWR  = settled.length ? (totalWon / settled.length) * 100 : null;
  const avgOdds    = allLegs.length ? allLegs.reduce((s, l) => s + l.odds, 0) / allLegs.length : 0;

  // ── By league ──────────────────────────────────────────────────────────────
  const lgMap: Record<string, { won: number; lost: number; pending: number; oddsSum: number; oddsCount: number }> = {};
  for (const leg of allLegs) {
    if (!lgMap[leg.league]) lgMap[leg.league] = { won: 0, lost: 0, pending: 0, oddsSum: 0, oddsCount: 0 };
    lgMap[leg.league].oddsSum   += leg.odds;
    lgMap[leg.league].oddsCount += 1;
    if (leg.status === 'pending')      lgMap[leg.league].pending++;
    else if (WIN(leg.status))          lgMap[leg.league].won++;
    else if (SETTLED(leg.status))      lgMap[leg.league].lost++;
  }
  const leagueRows = Object.entries(lgMap).map(([league, d]) => ({
    league,
    legs:    d.won + d.lost + d.pending,
    won:     d.won,
    lost:    d.lost,
    pending: d.pending,
    settled: d.won + d.lost,
    winRate: d.won + d.lost > 0 ? (d.won / (d.won + d.lost)) * 100 : null,
    avgOdds: d.oddsCount > 0 ? d.oddsSum / d.oddsCount : 0,
  })).sort((a, b) => b.legs - a.legs);

  // ── Odds range accuracy ────────────────────────────────────────────────────
  const oddsRanges = ODDS_RANGES.map(r => {
    const inRange   = allLegs.filter(l => l.odds >= r.min && (r.max === Infinity ? true : l.odds < r.max));
    const settledR  = inRange.filter(l => SETTLED(l.status));
    const wonR      = settledR.filter(l => WIN(l.status));
    return {
      label:   r.label,
      count:   inRange.length,
      won:     wonR.length,
      lost:    settledR.length - wonR.length,
      pending: inRange.length - settledR.length,
      winRate: settledR.length > 0 ? (wonR.length / settledR.length) * 100 : null,
    };
  }).filter(r => r.count > 0);

  // ── Most backed teams ──────────────────────────────────────────────────────
  const teamMap: Record<string, { won: number; lost: number; pending: number }> = {};
  for (const leg of allLegs) {
    const sep  = [' vs ', ' v ', ' - ', ' vs. '].find(s => leg.match.toLowerCase().includes(s.toLowerCase()));
    const teams = sep
      ? leg.match.split(new RegExp(sep, 'i')).map(t => t.trim()).filter(Boolean)
      : [leg.match.trim()];
    for (const team of teams) {
      if (!teamMap[team]) teamMap[team] = { won: 0, lost: 0, pending: 0 };
      if (leg.status === 'pending') teamMap[team].pending++;
      else if (WIN(leg.status))     teamMap[team].won++;
      else if (SETTLED(leg.status)) teamMap[team].lost++;
    }
  }
  const topTeams = Object.entries(teamMap)
    .map(([team, d]) => ({
      team,
      total:   d.won + d.lost + d.pending,
      won:     d.won,
      lost:    d.lost,
      pending: d.pending,
      winRate: d.won + d.lost > 0 ? (d.won / (d.won + d.lost)) * 100 : null,
    }))
    .filter(t => t.total >= 2)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const maxLegs = Math.max(...leagueRows.map(r => r.legs), 1);

  return (
    <div className="space-y-4 fade-in">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold text-gray-900">Parlay Leg Analysis</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
          {allLegs.length} legs · {parlays.length} parlays
        </span>
      </div>

      {/* Top-line metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Settled Legs',
            value: `${settled.length} / ${allLegs.length}`,
            sub:   pending > 0 ? `${pending} still pending` : 'All resolved',
            color: 'text-gray-900',
          },
          {
            label: 'Leg Win Rate',
            value: overallWR !== null ? `${overallWR.toFixed(0)}%` : '—',
            sub:   `${totalWon}W · ${totalLost}L`,
            color: winColor(overallWR),
          },
          {
            label: 'Avg Leg Odds',
            value: `${avgOdds.toFixed(2)}`,
            sub:   'across all legs',
            color: 'text-[#AF52DE]',
          },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-black/[0.04] shadow-card p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{m.label}</p>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* League table + Odds range side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

        {/* League breakdown */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/[0.04] shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Leg Performance by League</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Individual leg results from all parlays</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left pl-5">League</th>
                <th className="py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Legs</th>
                <th className="py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">W · L</th>
                <th className="py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right pr-4">Win %</th>
                <th className="py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right pr-5">Avg @</th>
              </tr>
            </thead>
            <tbody>
              {leagueRows.map((r, i) => (
                <tr key={r.league} className={`hover:bg-gray-50/60 transition-colors ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <td className="pl-5 pr-3 py-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${leagueDot(r.league)}`}>{r.league}</span>
                    </div>
                    {/* Volume bar */}
                    <div className="h-1 rounded-full bg-gray-100 w-28">
                      <div
                        className="h-full rounded-full bg-gray-300 transition-all"
                        style={{ width: `${(r.legs / maxLegs) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right text-sm text-gray-600 font-medium">{r.legs}</td>
                  <td className="px-3 py-3.5 text-right text-sm">
                    <span className="font-semibold text-[#34C759]">{r.won}</span>
                    <span className="text-gray-300"> · </span>
                    <span className="font-semibold text-[#FF3B30]">{r.lost}</span>
                    {r.pending > 0 && <span className="text-orange-400 text-xs"> +{r.pending}p</span>}
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    {r.winRate !== null ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-sm font-bold ${winColor(r.winRate)}`}>{r.winRate.toFixed(0)}%</span>
                        <div className="h-1 w-12 rounded-full bg-gray-100">
                          <div className={`h-full rounded-full ${barColor(r.winRate)}`} style={{ width: `${r.winRate}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="pl-3 pr-5 py-3.5 text-right text-sm text-gray-500">{r.avgOdds.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Odds range accuracy */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-black/[0.04] shadow-card p-5">
          <h3 className="text-sm font-bold text-gray-900">Accuracy by Odds Range</h3>
          <p className="text-[11px] text-gray-400 mt-0.5 mb-5">How well your picks land at each price</p>
          <div className="space-y-5">
            {oddsRanges.map(r => (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-gray-700">{r.label}</span>
                    <span className="text-[10px] text-gray-400 ml-2">{r.count} leg{r.count !== 1 ? 's' : ''}</span>
                  </div>
                  {r.winRate !== null ? (
                    <span className={`text-base font-bold ${winColor(r.winRate)}`}>{r.winRate.toFixed(0)}%</span>
                  ) : (
                    <span className="text-xs text-gray-300">Pending</span>
                  )}
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor(r.winRate)}`}
                    style={{ width: r.winRate !== null ? `${r.winRate}%` : '0%' }}
                  />
                </div>
                {r.winRate !== null && (
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-[#34C759] font-semibold">{r.won}W</span>
                    <span className="text-[10px] text-[#FF3B30] font-semibold">{r.lost}L</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Most backed teams */}
      {topTeams.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.04] shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Most Backed Teams</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Teams appearing in 2+ parlay legs</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {topTeams.map(t => (
              <div key={t.team} className={`rounded-xl p-3.5 border transition-colors ${cardBorder(t.winRate)}`}>
                <p className="text-xs font-bold text-gray-800 truncate leading-tight" title={t.team}>{t.team}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.total} leg{t.total !== 1 ? 's' : ''}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-[#34C759]">{t.won}W</p>
                    <p className="text-[10px] font-semibold text-[#FF3B30]">{t.lost}L</p>
                    {t.pending > 0 && <p className="text-[10px] font-semibold text-orange-400">{t.pending}P</p>}
                  </div>
                  {t.winRate !== null ? (
                    <span className={`text-xl font-bold ${winColor(t.winRate)}`}>{t.winRate.toFixed(0)}%</span>
                  ) : (
                    <span className="text-sm text-gray-300">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
