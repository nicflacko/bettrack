import { useState } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Target, BarChart2, Plus, ArrowDownCircle,
} from 'lucide-react';

import { Header }        from './components/Header';
import { StatCard }      from './components/StatCard';
import { BankrollChart } from './components/BankrollChart';
import { BetBreakdown }  from './components/BetBreakdown';
import { BetTable }      from './components/BetTable';
import { AddBetModal }   from './components/AddBetModal';
import { SettingsModal } from './components/SettingsModal';
import { LeagueTable }   from './components/LeagueTable';
import { CapitalModal }  from './components/CapitalModal';

import { useStore }      from './store';
import { computeStats, buildBankrollHistory, fmt, fmtPct, calcProfit } from './utils';
import { Bet, Tab } from './types';

export default function App() {
  const {
    bets, initialBankroll, transactions, loading,
    addBet, updateBet, deleteBet, setInitialBankroll,
    addTransaction, deleteTransaction,
  } = useStore();

  const [tab, setTab]                   = useState<Tab>('dashboard');
  const [showAdd, setShowAdd]           = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCapital, setShowCapital]   = useState(false);
  const [editingBet, setEditingBet]     = useState<Bet | null>(null);
  const [reusingBet, setReusingBet]     = useState<Bet | null>(null);

  const stats     = computeStats(initialBankroll, bets, transactions);
  const chartData = buildBankrollHistory(initialBankroll, bets, transactions);

  const pnlUp  = stats.totalProfit >= 0;
  const roiUp  = stats.roi >= 0;
  const wrGood = stats.winRate >= 50;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <Header
        activeTab={tab}
        onTabChange={setTab}
        onAddBet={() => setShowAdd(true)}
        onSettings={() => setShowSettings(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ─── DASHBOARD ─────────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Bankroll card — has inline capital button */}
              <div className="relative">
                <StatCard
                  title="Bankroll"
                  value={fmt(stats.bankroll)}
                  subtitle={`Started ${fmt(initialBankroll)}${stats.netDeposits !== 0 ? ` · Net ${fmt(stats.netDeposits, true)}` : ''}`}
                  icon={<Wallet size={17} />}
                  iconBg="bg-blue-50"
                  iconColor="text-[#007AFF]"
                />
                <button
                  onClick={() => setShowCapital(true)}
                  title="Manage deposits & withdrawals"
                  className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-semibold text-[#007AFF] hover:opacity-75 transition-opacity"
                >
                  <ArrowDownCircle size={11} />
                  Manage
                </button>
              </div>

              <StatCard
                title="Total P&L"
                value={fmt(stats.totalProfit, true)}
                subtitle={`${stats.settledCount} settled bets`}
                valueColor={pnlUp ? 'green' : 'red'}
                icon={pnlUp ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
                iconBg={pnlUp ? 'bg-green-50' : 'bg-red-50'}
                iconColor={pnlUp ? 'text-[#34C759]' : 'text-[#FF3B30]'}
              />
              <StatCard
                title="Win Rate"
                value={fmtPct(stats.winRate)}
                subtitle={`${stats.wonCount}W · ${stats.lostCount}L`}
                valueColor={wrGood ? 'green' : 'red'}
                icon={<Target size={17} />}
                iconBg={wrGood ? 'bg-green-50' : 'bg-red-50'}
                iconColor={wrGood ? 'text-[#34C759]' : 'text-[#FF3B30]'}
              />
              <StatCard
                title="ROI"
                value={fmtPct(stats.roi, true)}
                subtitle={`Staked ${fmt(stats.totalStaked)}`}
                valueColor={roiUp ? 'purple' : 'red'}
                icon={<BarChart2 size={17} />}
                iconBg={roiUp ? 'bg-purple-50' : 'bg-red-50'}
                iconColor={roiUp ? 'text-[#AF52DE]' : 'text-[#FF3B30]'}
              />
            </div>

            {/* Chart + breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="lg:col-span-3">
                <BankrollChart data={chartData} initialBankroll={initialBankroll} />
              </div>
              <div className="lg:col-span-2">
                <BetBreakdown
                  won={stats.wonCount}
                  lost={stats.lostCount}
                  halfWon={stats.halfWonCount}
                  halfLost={stats.halfLostCount}
                  pending={stats.pendingCount}
                  voided={stats.voidCount}
                  bestWin={stats.bestWin}
                  avgOdds={stats.avgOdds}
                  avgStake={stats.avgStake}
                  pendingExposure={stats.pendingExposure}
                  streak={stats.currentStreak}
                />
              </div>
            </div>

            {/* Recent bets */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">Recent Bets</h2>
                {bets.length > 5 && (
                  <button
                    onClick={() => setTab('bets')}
                    className="text-xs font-semibold text-[#007AFF] hover:opacity-75 transition-opacity"
                  >
                    View all {bets.length} →
                  </button>
                )}
              </div>
              <BetTable
                bets={bets}
                onUpdateStatus={(id, s) => updateBet(id, { status: s })}
                onDelete={deleteBet}
                onEdit={setEditingBet}
                onReuse={setReusingBet}
                limit={5}
              />
            </section>
          </>
        )}

        {/* ─── MY BETS ───────────────────────────────────────────────── */}
        {tab === 'bets' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Bets</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {bets.length} total · {stats.pendingCount} pending
                </p>
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm shadow-blue-500/25"
              >
                <Plus size={15} strokeWidth={2.5} />
                Add Bet
              </button>
            </div>
            <BetTable
              bets={bets}
              onUpdateStatus={(id, s) => updateBet(id, { status: s })}
              onDelete={deleteBet}
              onEdit={setEditingBet}
              onReuse={setReusingBet}
            />
          </>
        )}

        {/* ─── ANALYTICS ─────────────────────────────────────────────── */}
        {tab === 'analytics' && (
          <>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>

            {/* Capital summary row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                title="Total Bets"
                value={String(stats.totalBets)}
                subtitle={`${stats.pendingCount} pending`}
                icon={<Target size={17} />}
                iconBg="bg-blue-50"
                iconColor="text-[#007AFF]"
              />
              <StatCard
                title="Total Staked"
                value={fmt(stats.totalStaked)}
                subtitle={`Avg ${fmt(stats.avgStake)} / bet`}
                icon={<Wallet size={17} />}
                iconBg="bg-orange-50"
                iconColor="text-[#FF9F0A]"
              />
              <StatCard
                title="Net Deposits"
                value={fmt(stats.netDeposits, true)}
                subtitle={`${fmt(stats.totalDeposits)} in · ${fmt(stats.totalWithdrawals)} out`}
                valueColor={stats.netDeposits >= 0 ? 'green' : 'orange'}
                icon={<ArrowDownCircle size={17} />}
                iconBg="bg-green-50"
                iconColor="text-[#34C759]"
              />
              <StatCard
                title="Best Win"
                value={fmt(stats.bestWin)}
                subtitle="Single bet profit"
                valueColor="green"
                icon={<TrendingUp size={17} />}
                iconBg="bg-green-50"
                iconColor="text-[#34C759]"
              />
            </div>

            {/* Chart + breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="lg:col-span-3">
                <BankrollChart data={chartData} initialBankroll={initialBankroll} />
              </div>
              <div className="lg:col-span-2">
                <BetBreakdown
                  won={stats.wonCount}
                  lost={stats.lostCount}
                  halfWon={stats.halfWonCount}
                  halfLost={stats.halfLostCount}
                  pending={stats.pendingCount}
                  voided={stats.voidCount}
                  bestWin={stats.bestWin}
                  avgOdds={stats.avgOdds}
                  avgStake={stats.avgStake}
                  pendingExposure={stats.pendingExposure}
                  streak={stats.currentStreak}
                />
              </div>
            </div>

            {/* Parlay performance */}
            {stats.parlayCount > 0 && (() => {
              const parlayBets = bets.filter(b => b.betType === 'parlay');
              const LEG_DOT: Record<string, string> = {
                won: 'bg-[#34C759]', lost: 'bg-[#FF3B30]',
                'half-won': 'bg-yellow-400', 'half-lost': 'bg-amber-400',
                void: 'bg-gray-300', pending: 'bg-orange-400',
              };
              const LEAGUE_COLORS: Record<string, string> = {
                'Premier League': 'bg-purple-50 text-purple-600',
                'La Liga':        'bg-orange-50 text-orange-600',
                'Serie A':        'bg-blue-50 text-blue-600',
                'Bundesliga':     'bg-red-50 text-red-600',
                'Ligue 1':        'bg-sky-50 text-sky-600',
                'Champions League': 'bg-indigo-50 text-indigo-600',
                'Europa League':  'bg-orange-50 text-orange-500',
              };
              const legColor = (l: string) => LEAGUE_COLORS[l] ?? 'bg-gray-100 text-gray-500';
              const STATUS_STYLE: Record<string, { pill: string; label: string }> = {
                won:         { pill: 'bg-green-50 text-green-600',   label: 'Won'    },
                lost:        { pill: 'bg-red-50 text-red-500',       label: 'Lost'   },
                pending:     { pill: 'bg-orange-50 text-orange-600', label: 'Pending'},
                void:        { pill: 'bg-gray-100 text-gray-500',    label: 'Void'   },
                'half-won':  { pill: 'bg-yellow-50 text-yellow-600', label: '½ Won'  },
                'half-lost': { pill: 'bg-amber-50 text-amber-600',   label: '½ Lost' },
              };
              return (
                <div className="space-y-4 fade-in">
                  {/* Summary strip */}
                  <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 rounded-2xl border border-purple-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-base">🎲</span>
                      <h2 className="text-sm font-bold text-gray-900">Parlay Performance</h2>
                      <span className="ml-auto text-[11px] font-semibold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-lg">
                        {stats.parlayCount} parlay{stats.parlayCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Record',    value: `${stats.parlayWonCount}W · ${stats.parlayLostCount}L`, sub: `${stats.parlayCount - stats.parlayWonCount - stats.parlayLostCount} pending`, color: 'text-gray-900' },
                        { label: 'P&L',       value: fmt(stats.parlayProfit, true), sub: `Staked ${fmt(stats.parlayStaked)}`, color: stats.parlayProfit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]' },
                        { label: 'ROI',       value: fmtPct(stats.parlayRoi, true), sub: `Overall ${fmtPct(stats.roi, true)}`, color: stats.parlayRoi >= 0 ? 'text-[#AF52DE]' : 'text-[#FF3B30]' },
                        { label: 'Best Win',  value: fmt(stats.bestParlay), sub: 'Single parlay profit', color: 'text-[#34C759]' },
                      ].map(m => (
                        <div key={m.label} className="bg-white/70 rounded-xl p-3 border border-white">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{m.label}</p>
                          <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{m.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Individual parlay cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {parlayBets.map(parlay => {
                      const profit = calcProfit(parlay);
                      const settled = ['won','lost','half-won','half-lost'].includes(parlay.status);
                      const ss = STATUS_STYLE[parlay.status] ?? STATUS_STYLE.pending;
                      return (
                        <div key={parlay.id} className="bg-white rounded-2xl border border-black/[0.04] shadow-card p-4">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{parlay.match}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {new Date(parlay.matchDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                {' · '}${parlay.stake.toFixed(2)} stake
                                {' · '}@{parlay.odds % 1 === 0 ? parlay.odds.toFixed(2) : String(parlay.odds).replace(/\.?0+$/, '')}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setReusingBet(parlay)}
                                  className="flex items-center gap-1 text-[10px] font-semibold text-purple-400 hover:text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg transition-colors"
                                  title="Reuse this parlay"
                                >
                                  ↺ Reuse
                                </button>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${ss.pill}`}>{ss.label}</span>
                              </div>
                              {settled && (
                                <span className={`text-sm font-bold ${profit >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                                  {profit >= 0 ? '+' : ''}${Math.abs(profit).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Legs */}
                          <div className="space-y-1.5 pt-3 border-t border-gray-50">
                            {parlay.legs?.map((leg, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${LEG_DOT[leg.status] ?? 'bg-gray-300'}`} />
                                <span className="text-xs text-gray-600 truncate flex-1 min-w-0">
                                  {leg.match}
                                  <span className="text-gray-400"> — {leg.selection}</span>
                                </span>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${legColor(leg.league)}`}>
                                  {leg.league}
                                </span>
                                <span className="text-[11px] text-gray-400 shrink-0">@{leg.odds}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* League breakdown */}
            <LeagueTable bets={bets} />
          </>
        )}
      </main>

      {showAdd && <AddBetModal onAdd={addBet} onClose={() => setShowAdd(false)} />}

      {editingBet && (
        <AddBetModal
          editBet={editingBet}
          onAdd={addBet}
          onUpdate={updateBet}
          onClose={() => setEditingBet(null)}
        />
      )}

      {reusingBet && (
        <AddBetModal
          reuseBet={reusingBet}
          onAdd={addBet}
          onClose={() => setReusingBet(null)}
        />
      )}

      {showCapital && (
        <CapitalModal
          transactions={transactions}
          initialBankroll={initialBankroll}
          netDeposits={stats.netDeposits}
          currentBankroll={stats.bankroll}
          onAdd={addTransaction}
          onDelete={deleteTransaction}
          onClose={() => setShowCapital(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          initialBankroll={initialBankroll}
          onUpdate={setInitialBankroll}
          onClose={() => setShowSettings(false)}
          onClearAll={() => bets.forEach(b => deleteBet(b.id))}
        />
      )}
    </div>
  );
}
