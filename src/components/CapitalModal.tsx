import { useState, useEffect } from 'react';
import { X, Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Transaction } from '../types';
import { fmt } from '../utils';

interface Props {
  transactions:    Transaction[];
  initialBankroll: number;
  netDeposits:     number;
  currentBankroll: number;
  onAdd:           (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onDelete:        (id: string) => void;
  onClose:         () => void;
}

type FormMode = 'deposit' | 'withdrawal' | null;

export const CapitalModal = ({
  transactions, initialBankroll, netDeposits, currentBankroll,
  onAdd, onDelete, onClose,
}: Props) => {
  const [mode, setMode]       = useState<FormMode>(null);
  const [amount, setAmount]   = useState('');
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes]     = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const openForm = (m: FormMode) => {
    setMode(m);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) { setError('Enter a valid amount greater than 0'); return; }
    if (!mode) return;
    onAdd({ type: mode, amount: n, date, notes: notes.trim() });
    setMode(null);
  };

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="slide-up relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-modal overflow-hidden max-h-[92vh] flex flex-col">

        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">Manage Capital</h2>
            <p className="text-xs text-gray-400 mt-0.5">Track deposits & withdrawals</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">

          {/* Capital summary */}
          <div className="mx-5 mt-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-3">Capital Breakdown</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Starting Capital</span>
                <span className="text-sm font-semibold text-gray-700">{fmt(initialBankroll)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Net Deposits</span>
                <span className={`text-sm font-semibold ${netDeposits >= 0 ? 'text-[#34C759]' : 'text-[#FF9F0A]'}`}>
                  {fmt(netDeposits, true)}
                </span>
              </div>
              <div className="h-px bg-blue-100 my-1" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Total Capital</span>
                <span className="text-base font-bold text-blue-700">{fmt(initialBankroll + netDeposits)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Current Bankroll (incl. P&L)</span>
                <span className={`text-sm font-bold ${currentBankroll >= initialBankroll + netDeposits ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                  {fmt(currentBankroll)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!mode && (
            <div className="grid grid-cols-2 gap-3 mx-5 mt-4">
              <button
                onClick={() => openForm('deposit')}
                className="flex items-center justify-center gap-2 bg-[#34C759]/10 hover:bg-[#34C759]/20 text-[#34C759] font-bold py-3.5 rounded-2xl transition-colors"
              >
                <ArrowDownCircle size={18} />
                Deposit
              </button>
              <button
                onClick={() => openForm('withdrawal')}
                className="flex items-center justify-center gap-2 bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] font-bold py-3.5 rounded-2xl transition-colors"
              >
                <ArrowUpCircle size={18} />
                Withdraw
              </button>
            </div>
          )}

          {/* Inline form */}
          {mode && (
            <form onSubmit={submit} className="mx-5 mt-4 space-y-3">
              {/* Mode banner */}
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
                mode === 'deposit'
                  ? 'bg-[#34C759]/10 border border-[#34C759]/20'
                  : 'bg-[#FF9F0A]/10 border border-[#FF9F0A]/20'
              }`}>
                <div className="flex items-center gap-2">
                  {mode === 'deposit'
                    ? <ArrowDownCircle size={16} className="text-[#34C759]" />
                    : <ArrowUpCircle   size={16} className="text-[#FF9F0A]" />}
                  <span className={`text-sm font-bold capitalize ${mode === 'deposit' ? 'text-[#34C759]' : 'text-[#FF9F0A]'}`}>
                    {mode}
                  </span>
                </div>
                <button type="button" onClick={() => setMode(null)} className="text-gray-400 hover:text-gray-600 text-xs font-medium">
                  Cancel
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setError(''); }}
                  placeholder="e.g. 100"
                  step="0.01"
                  min="0.01"
                  autoFocus
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-300
                    transition-all ${error
                      ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-200 bg-gray-50 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100'
                    }`}
                />
                {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900
                    focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Notes <span className="normal-case font-normal text-gray-300">(optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={mode === 'deposit' ? 'e.g. Monthly top-up' : 'e.g. Cashed out winnings'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900
                    placeholder-gray-300 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <button
                type="submit"
                className={`w-full font-bold py-3 rounded-xl text-sm text-white transition-colors shadow-sm ${
                  mode === 'deposit'
                    ? 'bg-[#34C759] hover:bg-[#2DB350] shadow-green-500/25'
                    : 'bg-[#FF9F0A] hover:bg-[#E8920A] shadow-orange-500/25'
                }`}
              >
                Confirm {mode === 'deposit' ? 'Deposit' : 'Withdrawal'}
              </button>
            </form>
          )}

          {/* Transaction history */}
          <div className="mx-5 mt-5 mb-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              History {sorted.length > 0 && <span className="text-gray-300 normal-case font-normal">({sorted.length})</span>}
            </p>

            {sorted.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No transactions yet. Add a deposit or withdrawal above.
              </div>
            ) : (
              <div className="space-y-2">
                {sorted.map(t => (
                  <div key={t.id} className="group flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        t.type === 'deposit' ? 'bg-[#34C759]/15' : 'bg-[#FF9F0A]/15'
                      }`}>
                        {t.type === 'deposit'
                          ? <ArrowDownCircle size={16} className="text-[#34C759]" />
                          : <ArrowUpCircle   size={16} className="text-[#FF9F0A]" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 capitalize">
                          {t.notes || t.type}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${t.type === 'deposit' ? 'text-[#34C759]' : 'text-[#FF9F0A]'}`}>
                        {t.type === 'deposit' ? '+' : '-'}{fmt(t.amount)}
                      </span>
                      <button
                        onClick={() => onDelete(t.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-[#FF3B30] p-1"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
