import { TrendingUp, Plus, Settings } from 'lucide-react';
import { Tab } from '../types';

interface Props {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  onAddBet: () => void;
  onSettings: () => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'bets',      label: 'My Bets'   },
  { id: 'analytics', label: 'Analytics' },
];

export const Header = ({ activeTab, onTabChange, onAddBet, onSettings }: Props) => (
  <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-black/[0.06]">
    <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between gap-4">

      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/30">
          <TrendingUp size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-gray-900 text-[17px] tracking-tight">BetTrack</span>
      </div>

      {/* Tab switcher */}
      <nav className="flex items-center bg-gray-100 rounded-[12px] p-1 gap-0.5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-1.5 rounded-[9px] text-sm font-medium transition-all duration-150 ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onSettings}
          className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          title="Settings"
        >
          <Settings size={17} />
        </button>
        <button
          onClick={onAddBet}
          className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-500/25"
        >
          <Plus size={15} strokeWidth={2.5} />
          Add Bet
        </button>
      </div>
    </div>
  </header>
);
