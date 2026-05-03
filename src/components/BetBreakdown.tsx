interface Props {
  won:     number;
  lost:    number;
  pending: number;
  voided:  number;
  bestWin:  number;
  avgOdds:  number;
  avgStake: number;
  pendingExposure: number;
  streak: { type: 'W' | 'L' | null; count: number };
}

interface BarRow {
  label: string;
  count: number;
  pct:   number;
  color: string;
  bg:    string;
}

export const BetBreakdown = ({
  won, lost, pending, voided,
  bestWin, avgOdds, avgStake, pendingExposure, streak,
}: Props) => {
  const total = won + lost + pending + voided;

  const bars: BarRow[] = [
    { label: 'Won',     count: won,     pct: total ? won / total     : 0, color: 'bg-[#34C759]', bg: 'bg-[#34C759]/10' },
    { label: 'Lost',    count: lost,    pct: total ? lost / total    : 0, color: 'bg-[#FF3B30]', bg: 'bg-[#FF3B30]/10' },
    { label: 'Pending', count: pending, pct: total ? pending / total : 0, color: 'bg-[#FF9F0A]', bg: 'bg-[#FF9F0A]/10' },
  ];

  const streakLabel = streak.type
    ? `${streak.count}${streak.type === 'W' ? 'W' : 'L'} streak`
    : '—';

  return (
    <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-card h-full flex flex-col">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Bet Breakdown</h3>

      {/* Stacked visual bars */}
      <div className="space-y-3 mb-5">
        {bars.map(bar => (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${bar.color}`} />
                <span className="text-xs text-gray-500 font-medium">{bar.label}</span>
              </div>
              <span className="text-xs font-bold text-gray-700">{bar.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${bar.color} transition-all duration-700`}
                style={{ width: `${bar.pct * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-50 mb-4" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 flex-1">
        <Stat label="Best Win"   value={`+$${bestWin.toFixed(2)}`}  color="text-[#34C759]" />
        <Stat label="Avg Odds"   value={avgOdds.toFixed(2)}          />
        <Stat label="Avg Stake"  value={`$${avgStake.toFixed(2)}`}   />
        <Stat label="Exposure"   value={`$${pendingExposure.toFixed(2)}`} color="text-[#FF9F0A]" />
        <div className="col-span-2">
          <Stat
            label="Current Streak"
            value={streakLabel}
            color={streak.type === 'W' ? 'text-[#34C759]' : streak.type === 'L' ? 'text-[#FF3B30]' : 'text-gray-400'}
          />
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, color = 'text-gray-800' }: { label: string; value: string; color?: string }) => (
  <div>
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
    <p className={`text-sm font-bold ${color}`}>{value}</p>
  </div>
);
