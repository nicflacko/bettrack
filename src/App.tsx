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
import { computeStats, buildBankrollHistory, fmt, fmtPct } from './utils';
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
