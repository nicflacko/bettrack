import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface Props {
  initialBankroll: number;
  onUpdate:        (n: number) => void;
  onClose:         () => void;
  onClearAll?:     () => void;
}

export const SettingsModal = ({ initialBankroll, onUpdate, onClose, onClearAll }: Props) => {
  const [value, setValue]     = useState(String(initialBankroll));
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const save = () => {
    const n = parseFloat(value);
    if (!isNaN(n) && n > 0) { onUpdate(n); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="slide-up relative bg-white w-full max-w-sm rounded-3xl shadow-modal overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="text-[17px] font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Starting bankroll */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Starting Bankroll ($)
            </label>
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              min="1"
              step="1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900
                focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              This is the baseline used to calculate your P&L and ROI.
            </p>
          </div>

          <button
            onClick={save}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Save Changes
          </button>

          {/* Danger zone */}
          {onClearAll && (
            <div className="pt-2 border-t border-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Danger Zone</p>
              {!confirm ? (
                <button
                  onClick={() => setConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-400
                    hover:bg-red-50 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <AlertTriangle size={14} />
                  Clear All Bets
                </button>
              ) : (
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-600 mb-3">
                    This will permanently delete all your bets. Are you sure?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirm(false)}
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { onClearAll(); onClose(); }}
                      className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
                    >
                      Yes, Delete All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
