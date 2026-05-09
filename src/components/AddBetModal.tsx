import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Bet, BetStatus } from '../types';

interface Props {
  onAdd:   (bet: Omit<Bet, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const LEAGUES = [
  'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
  'Champions League', 'Europa League', 'Eredivisie', 'Liga Portugal',
  'Saudi League', 'MLS', 'Other',
];

const MARKETS = [
  'Match Winner', 'Draw No Bet', 'Double Chance',
  'Asian Handicap', 'Over/Under 1.5 Goals', 'Over/Under 2.5 Goals',
  'Over/Under 3.5 Goals', 'Both Teams to Score',
  'Anytime Goalscorer', 'First Goal Scorer',
  'Over/Under Corners', 'Cards', 'Correct Score',
  'Half Time Result', 'Other',
];

type FormData = {
  match: string; league: string; market: string; selection: string;
  odds: string; stake: string; matchDate: string;
  status: BetStatus; notes: string;
};

const blank: FormData = {
  match: '', league: 'Premier League', market: 'Match Winner',
  selection: '', odds: '', stake: '',
  matchDate: new Date().toISOString().split('T')[0],
  status: 'pending', notes: '',
};

const STATUS_OPTIONS: { value: BetStatus; label: string; emoji: string; active: string }[] = [
  { value: 'pending',   label: 'Pending', emoji: '⏳', active: 'bg-orange-50 border-orange-300 text-orange-700' },
  { value: 'won',       label: 'Won',     emoji: '✅', active: 'bg-green-50  border-green-300  text-green-700'  },
  { value: 'lost',      label: 'Lost',    emoji: '❌', active: 'bg-red-50    border-red-300    text-red-600'    },
  { value: 'half-won',  label: '½ Won',   emoji: '🟡', active: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
  { value: 'half-lost', label: '½ Lost',  emoji: '🟠', active: 'bg-amber-50  border-amber-300  text-amber-700'  },
  { value: 'void',      label: 'Void',    emoji: '⚪', active: 'bg-gray-100  border-gray-300   text-gray-600'   },
];

const Input = ({
  label, error, optional, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; optional?: boolean }) => (
  <div>
    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
      {label}
      {optional && <span className="normal-case font-normal text-gray-300">(optional)</span>}
    </label>
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-300
        transition-all duration-150
        ${error
          ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
          : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100'
        }`}
    />
    {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
  </div>
);

const Select = ({
  label, children, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) => (
  <div>
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
      {label}
    </label>
    <div className="relative">
      <select
        {...props}
        className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50
          text-sm text-gray-900 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100
          transition-all duration-150 pr-9"
      >
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

export const AddBetModal = ({ onAdd, onClose }: Props) => {
  const [form, setForm]   = useState<FormData>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const set = (k: keyof FormData, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.match.trim())               e.match     = 'Match is required';
    if (!form.selection.trim())           e.selection = 'Selection is required';
    if (!form.odds || +form.odds < 1.01)  e.odds      = 'Odds must be ≥ 1.01';
    if (!form.stake || +form.stake <= 0)  e.stake     = 'Enter a valid stake';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onAdd({
      match:     form.match.trim(),
      league:    form.league,
      market:    form.market,
      selection: form.selection.trim(),
      odds:      +form.odds,
      stake:     +form.stake,
      matchDate: form.matchDate,
      status:    form.status,
      notes:     form.notes.trim(),
    });
    onClose();
  };

  const potReturn = form.odds && form.stake ? (+form.odds * +form.stake).toFixed(2) : null;
  const potProfit = form.odds && form.stake ? ((+form.odds - 1) * +form.stake).toFixed(2) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet / Modal */}
      <div className="slide-up relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-modal overflow-hidden max-h-[95vh] flex flex-col">

        {/* Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">Add New Bet</h2>
            <p className="text-xs text-gray-400 mt-0.5">Log a bet to track your P&L</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={submit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Match */}
          <Input
            label="Match"
            value={form.match}
            onChange={e => set('match', e.target.value)}
            placeholder="e.g. Man United vs Liverpool"
            error={errors.match}
          />

          {/* League + Date */}
          <div className="grid grid-cols-2 gap-3">
            <Select label="League" value={form.league} onChange={e => set('league', e.target.value)}>
              {LEAGUES.map(l => <option key={l}>{l}</option>)}
            </Select>
            <Input
              label="Match Date"
              type="date"
              value={form.matchDate}
              onChange={e => set('matchDate', e.target.value)}
            />
          </div>

          {/* Market + Selection */}
          <div className="grid grid-cols-2 gap-3">
            <Select label="Market" value={form.market} onChange={e => set('market', e.target.value)}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </Select>
            <Input
              label="Selection"
              value={form.selection}
              onChange={e => set('selection', e.target.value)}
              placeholder="e.g. Man United Win"
              error={errors.selection}
            />
          </div>

          {/* Odds + Stake */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Odds (Decimal)"
              type="number"
              value={form.odds}
              onChange={e => set('odds', e.target.value)}
              placeholder="e.g. 2.25"
              step="0.01"
              min="1.01"
              error={errors.odds}
            />
            <Input
              label="Stake ($)"
              type="number"
              value={form.stake}
              onChange={e => set('stake', e.target.value)}
              placeholder="e.g. 50"
              step="0.01"
              min="0.01"
              error={errors.stake}
            />
          </div>

          {/* Live return preview */}
          {potReturn && (
            <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Potential Return</p>
                <p className="text-xl font-bold text-blue-700 mt-0.5">${potReturn}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Potential Profit</p>
                <p className="text-xl font-bold text-[#34C759] mt-0.5">+${potProfit}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('status', opt.value)}
                  className={`py-2.5 rounded-xl border text-xs font-semibold transition-all
                    ${form.status === opt.value
                      ? opt.active
                      : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
                    }`}
                >
                  <span className="block text-base mb-0.5">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Notes <span className="normal-case font-normal text-gray-300">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any notes about this bet…"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900
                placeholder-gray-300 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100
                transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-bold py-3.5
              rounded-xl text-sm transition-all shadow-sm shadow-blue-500/25 mt-1"
          >
            Add Bet
          </button>

          <div className="h-1" /> {/* bottom breathing room */}
        </form>
      </div>
    </div>
  );
};
