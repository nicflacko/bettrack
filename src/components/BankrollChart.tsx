import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ChartPoint, ChartEventType } from '../utils';

interface Props {
  data: ChartPoint[];
  initialBankroll: number;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;

  if (payload.eventType === 'deposit') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#34C759" stroke="#fff" strokeWidth={2} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#fff" fontWeight="bold">↑</text>
      </g>
    );
  }
  if (payload.eventType === 'withdrawal') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#FF9F0A" stroke="#fff" strokeWidth={2} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#fff" fontWeight="bold">↓</text>
      </g>
    );
  }
  return null; // no dot for regular bets
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pt: ChartPoint = payload[0].payload;

  const eventLabel: Record<ChartEventType, string> = {
    start:      'Starting capital',
    bet:        '',
    deposit:    '💰 Deposit',
    withdrawal: '📤 Withdrawal',
  };

  return (
    <div className="bg-white rounded-2xl shadow-modal border border-black/[0.06] p-3.5 min-w-[160px]">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-[18px] font-bold text-gray-900 leading-tight">
        ${pt.bankroll.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
      {pt.match && (
        <p className={`text-[11px] mt-1 max-w-[180px] truncate font-medium
          ${pt.eventType === 'deposit' ? 'text-[#34C759]' : pt.eventType === 'withdrawal' ? 'text-[#FF9F0A]' : 'text-gray-400'}`}>
          {pt.eventType !== 'bet' ? eventLabel[pt.eventType] + ' · ' : ''}{pt.match}
        </p>
      )}
    </div>
  );
};

export const BankrollChart = ({ data, initialBankroll }: Props) => {
  const current = data[data.length - 1]?.bankroll ?? initialBankroll;
  const isUp    = current >= initialBankroll;
  const stroke  = isUp ? '#34C759' : '#FF3B30';
  const gradId  = 'bankrollGrad';

  const values  = data.map(d => d.bankroll);
  const minVal  = Math.min(...values, initialBankroll);
  const maxVal  = Math.max(...values, initialBankroll);
  const padding = (maxVal - minVal) * 0.15 || 50;

  const settledBets   = data.filter(d => d.eventType === 'bet').length;
  const depositCount  = data.filter(d => d.eventType === 'deposit').length;
  const withdrawCount = data.filter(d => d.eventType === 'withdrawal').length;

  return (
    <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-card h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Bankroll History</h3>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-gray-400">{settledBets} settled bet{settledBets !== 1 ? 's' : ''}</p>
            {depositCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#34C759]">
                <span className="w-2 h-2 rounded-full bg-[#34C759]" />
                {depositCount} deposit{depositCount !== 1 ? 's' : ''}
              </span>
            )}
            {withdrawCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#FF9F0A]">
                <span className="w-2 h-2 rounded-full bg-[#FF9F0A]" />
                {withdrawCount} withdrawal{withdrawCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Current</p>
          <p className={`text-xl font-bold mt-0.5 ${isUp ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
            ${current.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-xs font-medium ${isUp ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
            {isUp ? '▲' : '▼'} ${Math.abs(current - initialBankroll).toFixed(2)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={stroke} stopOpacity={0.18} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />

          <ReferenceLine
            y={initialBankroll}
            stroke="rgba(0,0,0,0.12)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minVal - padding, maxVal + padding]}
            tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `$${v}`}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.08)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="bankroll"
            stroke={stroke}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={<CustomDot />}
            activeDot={{ r: 5, fill: stroke, strokeWidth: 2.5, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
