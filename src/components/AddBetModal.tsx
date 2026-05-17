import { useState, useEffect } from 'react';
import { X, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Bet, BetStatus, BetType, ParlayLeg } from '../types';
import { deriveParlayStatus, calcParlayRawOdds } from '../utils';

interface Props {
  onAdd:      (bet: Omit<Bet, 'id' | 'createdAt'>) => void;
  onUpdate?:  (id: string, updates: Partial<Omit<Bet, 'id'>>) => void;
  onClose:    () => void;
  editBet?:   Bet;
  reuseBet?:  Bet; // pre-fills parlay form for a new submission (legs reset to pending)
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

const LEG_STATUSES: { value: BetStatus; label: string }[] = [
  { value: 'pending',   label: 'Pending'  },
  { value: 'won',       label: 'Won'      },
  { value: 'lost',      label: 'Lost'     },
  { value: 'void',      label: 'Void'     },
  { value: 'half-won',  label: '½ Won'    },
  { value: 'half-lost', label: '½ Lost'   },
];

const STATUS_OPTIONS: { value: BetStatus; label: string; emoji: string; active: string }[] = [
  { value: 'pending',   label: 'Pending', emoji: '⏳', active: 'bg-orange-50 border-orange-300 text-orange-700' },
  { value: 'won',       label: 'Won',     emoji: '✅', active: 'bg-green-50  border-green-300  text-green-700'  },
  { value: 'lost',      label: 'Lost',    emoji: '❌', active: 'bg-red-50    border-red-300    text-red-600'    },
  { value: 'half-won',  label: '½ Won',   emoji: '🟡', active: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
  { value: 'half-lost', label: '½ Lost',  emoji: '🟠', active: 'bg-amber-50  border-amber-300  text-amber-700'  },
  { value: 'void',      label: 'Void',    emoji: '⚪', active: 'bg-gray-100  border-gray-300   text-gray-600'   },
];

type SingleForm = {
  match: string; league: string; market: string; selection: string;
  odds: string; stake: string; matchDate: string; status: BetStatus; notes: string;
};

type LegData = { match: string; league: string; selection: string; odds: string; status: BetStatus };

const blankSingle: SingleForm = {
  match: '', league: 'Premier League', market: 'Match Winner',
  selection: '', odds: '', stake: '',
  matchDate: new Date().toISOString().split('T')[0],
  status: 'pending', notes: '',
};

const blankLeg = (): LegData => ({ match: '', league: 'Premier League', selection: '', odds: '', status: 'pending' });

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

const SelectField = ({
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

export const AddBetModal = ({ onAdd, onUpdate, onClose, editBet, reuseBet }: Props) => {
  const isEdit = !!editBet;
  const today  = new Date().toISOString().split('T')[0];

  // Source bet: editBet for editing, reuseBet for reuse, otherwise blank
  const initBetType: BetType = (editBet ?? reuseBet)?.betType ?? 'single';

  const [betType, setBetType] = useState<BetType>(initBetType);
  const [form, setForm] = useState<SingleForm>(
    editBet && editBet.betType === 'single'
      ? {
          match:     editBet.match,
          league:    editBet.league,
          market:    editBet.market,
          selection: editBet.selection,
          odds:      String(editBet.odds),
          stake:     String(editBet.stake),
          matchDate: editBet.matchDate,
          status:    editBet.status,
          notes:     editBet.notes ?? '',
        }
      : blankSingle
  );
  const [legs, setLegs] = useState<LegData[]>(
    editBet?.legs?.map(l => ({ ...l, league: l.league ?? 'Premier League', odds: String(l.odds) })) ??
    reuseBet?.legs?.map(l => ({ match: l.match, league: l.league ?? 'Premier League', selection: l.selection, odds: String(l.odds), status: 'pending' as BetStatus })) ??
    [blankLeg(), blankLeg()]
  );
  // parlay-level fields
  const [parlayName,  setParlayName]  = useState(editBet?.betType === 'parlay' ? editBet.match : (reuseBet?.betType === 'parlay' ? reuseBet.match : ''));
  const [parlayDate,  setParlayDate]  = useState(editBet?.betType === 'parlay' ? editBet.matchDate : today);
  const [parlayStake, setParlayStake] = useState((editBet ?? reuseBet)?.betType === 'parlay' ? String((editBet ?? reuseBet)!.stake) : '');
  const [parlayNotes, setParlayNotes] = useState(editBet?.betType === 'parlay' ? (editBet.notes ?? '') : '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const setF = (k: keyof SingleForm, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const setLeg = (i: number, k: keyof LegData, v: string) => {
    setLegs(prev => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
    setErrors(p => { const n = { ...p }; delete n[`leg${i}${k}`]; return n; });
  };

  const addLeg = () => setLegs(prev => [...prev, blankLeg()]);
  const removeLeg = (i: number) => setLegs(prev => prev.filter((_, idx) => idx !== i));

  // Derived parlay values
  const parsedLegs: ParlayLeg[] = legs.map(l => ({
    match:     l.match,
    league:    l.league,
    selection: l.selection,
    odds:      parseFloat(l.odds) || 1,
    status:    l.status,
  }));
  const parlayRawOdds    = legs.every(l => l.odds) ? calcParlayRawOdds(parsedLegs) : null;
  const parlayStatus     = deriveParlayStatus(parsedLegs);
  const parlayPotReturn  = parlayRawOdds && parlayStake ? (parlayRawOdds * +parlayStake).toFixed(2) : null;
  const parlayPotProfit  = parlayRawOdds && parlayStake ? ((parlayRawOdds - 1) * +parlayStake).toFixed(2) : null;

  const validateSingle = () => {
    const e: Record<string, string> = {};
    if (!form.match.trim())               e.match     = 'Required';
    if (!form.selection.trim())           e.selection = 'Required';
    if (!form.odds || +form.odds < 1.01)  e.odds      = 'Odds ≥ 1.01';
    if (!form.stake || +form.stake <= 0)  e.stake     = 'Enter a valid stake';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateParlay = () => {
    const e: Record<string, string> = {};
    if (!parlayStake || +parlayStake <= 0) e.parlayStake = 'Enter a valid stake';
    if (legs.length < 2) e.legs = 'Add at least 2 legs';
    legs.forEach((l, i) => {
      if (!l.match.trim())              e[`leg${i}match`]     = 'Required';
      if (!l.selection.trim())          e[`leg${i}selection`] = 'Required';
      if (!l.odds || +l.odds < 1.01)    e[`leg${i}odds`]      = 'Odds ≥ 1.01';
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submitSingle = () => {
    if (!validateSingle()) return;
    const payload = {
      match:     form.match.trim(),
      league:    form.league,
      market:    form.market,
      selection: form.selection.trim(),
      odds:      +form.odds,
      stake:     +form.stake,
      matchDate: form.matchDate,
      status:    form.status,
      betType:   'single' as BetType,
      notes:     form.notes.trim(),
    };
    if (isEdit && editBet && onUpdate) onUpdate(editBet.id, payload);
    else onAdd(payload);
    onClose();
  };

  const submitParlay = () => {
    if (!validateParlay()) return;
    const name = parlayName.trim() || `${legs.length}-Leg Parlay`;
    const selection = parsedLegs.map(l => l.selection).join(' · ');
    const rawOdds = calcParlayRawOdds(parsedLegs);
    const status  = deriveParlayStatus(parsedLegs);
    const payload = {
      match:     name,
      league:    (() => { const ls = [...new Set(parsedLegs.map(l => l.league))]; return ls.length === 1 ? ls[0] : 'Multi'; })(),
      market:    'Parlay',
      selection,
      odds:      rawOdds,
      stake:     +parlayStake,
      matchDate: parlayDate,
      status,
      betType:   'parlay' as BetType,
      legs:      parsedLegs,
      notes:     parlayNotes.trim(),
    };
    if (isEdit && editBet && onUpdate) onUpdate(editBet.id, payload);
    else onAdd(payload);
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (betType === 'single') submitSingle();
    else submitParlay();
  };

  const potReturn = form.odds && form.stake ? (+form.odds * +form.stake).toFixed(2) : null;
  const potProfit = form.odds && form.stake ? ((+form.odds - 1) * +form.stake).toFixed(2) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="slide-up relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-modal overflow-hidden max-h-[95vh] flex flex-col">

        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">
              {isEdit ? 'Edit Bet' : reuseBet ? 'Reuse Parlay' : 'Add New Bet'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? 'Update the details below' : reuseBet ? 'Edit legs then save as a new parlay' : 'Log a bet to track your P&L'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Bet type toggle */}
        {!isEdit && (
          <div className="px-6 pt-4 pb-0">
            <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
              {(['single', 'parlay'] as BetType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBetType(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize
                    ${betType === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t === 'parlay' ? '🎲 Parlay' : '⚡ Single'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* ── SINGLE ── */}
          {betType === 'single' && (
            <>
              <Input label="Match" value={form.match} onChange={e => setF('match', e.target.value)}
                placeholder="e.g. Man United vs Liverpool" error={errors.match} />

              <div className="grid grid-cols-2 gap-3">
                <SelectField label="League" value={form.league} onChange={e => setF('league', e.target.value)}>
                  {LEAGUES.map(l => <option key={l}>{l}</option>)}
                </SelectField>
                <Input label="Match Date" type="date" value={form.matchDate} onChange={e => setF('matchDate', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Market" value={form.market} onChange={e => setF('market', e.target.value)}>
                  {MARKETS.map(m => <option key={m}>{m}</option>)}
                </SelectField>
                <Input label="Selection" value={form.selection} onChange={e => setF('selection', e.target.value)}
                  placeholder="e.g. Man United Win" error={errors.selection} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Odds (Decimal)" type="number" value={form.odds} onChange={e => setF('odds', e.target.value)}
                  placeholder="e.g. 2.25" step="0.001" min="1.01" error={errors.odds} />
                <Input label="Stake ($)" type="number" value={form.stake} onChange={e => setF('stake', e.target.value)}
                  placeholder="e.g. 50" step="0.01" min="0.01" error={errors.stake} />
              </div>

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

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setF('status', opt.value)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all
                        ${form.status === opt.value ? opt.active : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'}`}>
                      <span className="block text-base mb-0.5">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Notes <span className="normal-case font-normal text-gray-300">(optional)</span>
                </label>
                <textarea value={form.notes} onChange={e => setF('notes', e.target.value)}
                  placeholder="Any notes about this bet…" rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900
                    placeholder-gray-300 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
              </div>
            </>
          )}

          {/* ── PARLAY ── */}
          {betType === 'parlay' && (
            <>
              {/* Parlay name + date */}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Parlay Name" optional value={parlayName} onChange={e => setParlayName(e.target.value)}
                  placeholder={`${legs.length}-Leg Parlay`} />
                <Input label="Date" type="date" value={parlayDate} onChange={e => setParlayDate(e.target.value)} />
              </div>

              {/* Legs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Legs ({legs.length})
                  </label>
                  <button type="button" onClick={addLeg}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#007AFF] hover:opacity-75 transition-opacity">
                    <Plus size={12} /> Add Leg
                  </button>
                </div>

                <div className="space-y-3">
                  {legs.map((leg, i) => (
                    <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400">Leg {i + 1}</span>
                        {legs.length > 2 && (
                          <button type="button" onClick={() => removeLeg(i)}
                            className="text-gray-300 hover:text-[#FF3B30] transition-colors p-0.5">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Match</label>
                          <input value={leg.match} onChange={e => setLeg(i, 'match', e.target.value)}
                            placeholder="e.g. Arsenal vs Chelsea"
                            className={`mt-1 w-full px-2.5 py-2 rounded-lg border text-xs text-gray-900 placeholder-gray-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all
                              ${errors[`leg${i}match`] ? 'border-red-300' : 'border-gray-200'}`} />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">League</label>
                          <div className="relative mt-1">
                            <select value={leg.league} onChange={e => setLeg(i, 'league', e.target.value)}
                              className="w-full appearance-none px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all pr-7">
                              {LEAGUES.map(l => <option key={l}>{l}</option>)}
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Selection</label>
                        <input value={leg.selection} onChange={e => setLeg(i, 'selection', e.target.value)}
                          placeholder="e.g. Arsenal Win"
                          className={`mt-1 w-full px-2.5 py-2 rounded-lg border text-xs text-gray-900 placeholder-gray-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all
                            ${errors[`leg${i}selection`] ? 'border-red-300' : 'border-gray-200'}`} />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Odds</label>
                          <input type="number" value={leg.odds} onChange={e => setLeg(i, 'odds', e.target.value)}
                            placeholder="e.g. 1.85" step="0.001" min="1.01"
                            className={`mt-1 w-full px-2.5 py-2 rounded-lg border text-xs text-gray-900 placeholder-gray-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all
                              ${errors[`leg${i}odds`] ? 'border-red-300' : 'border-gray-200'}`} />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Result</label>
                          <div className="relative mt-1">
                            <select value={leg.status} onChange={e => setLeg(i, 'status', e.target.value)}
                              className="w-full appearance-none px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all pr-7">
                              {LEG_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.legs && <p className="text-[11px] text-red-400 mt-1">{errors.legs}</p>}
              </div>

              {/* Combined odds preview */}
              {parlayRawOdds && (
                <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Combined Odds</p>
                      <p className="text-xl font-bold text-purple-700 mt-0.5">{parlayRawOdds.toFixed(3).replace(/\.?0+$/, '')}</p>
                    </div>
                    {parlayPotReturn && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Potential Profit</p>
                        <p className="text-xl font-bold text-[#34C759] mt-0.5">+${parlayPotProfit}</p>
                      </div>
                    )}
                  </div>
                  {parlayStatus !== 'pending' && (
                    <div className="mt-2 pt-2 border-t border-purple-100">
                      <p className="text-[10px] font-semibold text-purple-400">
                        Derived status: <span className="font-bold capitalize">{parlayStatus.replace('-', ' ')}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Stake */}
              <Input label="Stake ($)" type="number" value={parlayStake} onChange={e => setParlayStake(e.target.value)}
                placeholder="e.g. 10" step="0.01" min="0.01" error={errors.parlayStake} />

              {/* Notes */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Notes <span className="normal-case font-normal text-gray-300">(optional)</span>
                </label>
                <textarea value={parlayNotes} onChange={e => setParlayNotes(e.target.value)}
                  placeholder="Any notes…" rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900
                    placeholder-gray-300 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
              </div>
            </>
          )}

          <button type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-bold py-3.5
              rounded-xl text-sm transition-all shadow-sm shadow-blue-500/25 mt-1">
            {isEdit ? 'Save Changes' : reuseBet ? 'Save as New Parlay' : betType === 'parlay' ? 'Add Parlay' : 'Add Bet'}
          </button>

          <div className="h-1" />
        </form>
      </div>
    </div>
  );
};
