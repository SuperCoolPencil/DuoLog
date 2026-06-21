import { useState, useCallback, type FormEvent } from 'react';
import { PlusCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { Contributor, NewTransaction } from '../types';

interface TransactionFormProps {
  contributors: Contributor[];
  onAdd: (tx: NewTransaction) => Promise<void>;
}

type FormMode = 'INCOME' | 'EXPENSE' | null;

const todayISO = () => new Date().toISOString().slice(0, 16);

export function TransactionForm({ contributors, onAdd }: TransactionFormProps) {
  const [mode, setMode] = useState<FormMode>(null);
  const [amount, setAmount] = useState('');
  const [contributorId, setContributorId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const openModal = useCallback((m: FormMode) => {
    setMode(m);
    setAmount('');
    // Pre-select if only one contributor
    setContributorId(contributors.length === 1 ? contributors[0].id : '');
    setDescription('');
    setDate(todayISO());
    setError('');
  }, [contributors]);

  const closeModal = useCallback(() => {
    setMode(null);
    setError('');
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!mode) return;

      const parsedAmount = parseFloat(amount);
      if (!parsedAmount || parsedAmount <= 0) {
        setError('Enter a valid amount greater than 0.');
        return;
      }
      if (!contributorId) {
        setError('Select who is making this transaction.');
        return;
      }

      setSubmitting(true);
      setError('');
      try {
        await onAdd({
          type: mode,
          amount: parsedAmount,
          contributor_id: contributorId,
          description: description.trim(),
          date: new Date(date).toISOString(),
        });
        closeModal();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save transaction.');
      } finally {
        setSubmitting(false);
      }
    },
    [mode, amount, contributorId, description, date, onAdd, closeModal],
  );

  return (
    <>
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        <Button
          id="btn-add-income"
          variant="income"
          fullWidth
          onClick={() => openModal('INCOME')}
          aria-label="Add income"
        >
          <ArrowUpCircle size={18} />
          Add Funds
        </Button>
        <Button
          id="btn-add-expense"
          variant="expense"
          fullWidth
          onClick={() => openModal('EXPENSE')}
          aria-label="Log expense"
        >
          <ArrowDownCircle size={18} />
          Withdraw
        </Button>
      </div>

      {/* Transaction Modal */}
      <Modal
        isOpen={mode !== null}
        onClose={closeModal}
        title={mode === 'INCOME' ? 'Add Funds' : 'Withdraw / Spend'}
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Amount */}
          <div>
            <label htmlFor="tx-amount" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-zinc-400 text-sm select-none">
                ₹
              </span>
              <input
                id="tx-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-base pl-8 mono text-lg"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Contributor — required for both income and expense */}
          <div>
            <label
              htmlFor="tx-contributor"
              className="block text-xs font-medium text-zinc-400 mb-1.5"
            >
              {mode === 'INCOME' ? 'Received by' : 'Paid by'}
            </label>
            {contributors.length === 0 ? (
              <p className="text-xs text-zinc-500 border border-zinc-800 rounded-lg px-3 py-2.5">
                No contributors yet — add them in Settings first.
              </p>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(contributors.length, 3)}, 1fr)` }}>
                {contributors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    id={`contributor-pick-${c.id}`}
                    onClick={() => setContributorId(c.id)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all duration-100 ${
                      contributorId === c.id
                        ? mode === 'INCOME'
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                          : 'border-rose-500/60 bg-rose-500/10 text-rose-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="tx-description"
              className="block text-xs font-medium text-zinc-400 mb-1.5"
            >
              Description{' '}
              <span className="text-zinc-600">(optional)</span>
            </label>
            <textarea
              id="tx-description"
              rows={2}
              placeholder="What's this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-base resize-none"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="tx-date" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Date &amp; Time
            </label>
            <input
              id="tx-date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-base mono"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-1 pb-2">
            <Button type="button" variant="ghost" fullWidth onClick={closeModal} id="tx-cancel-btn">
              Cancel
            </Button>
            <Button
              type="submit"
              variant={mode === 'INCOME' ? 'income' : 'expense'}
              fullWidth
              disabled={submitting}
              id="tx-submit-btn"
            >
              <PlusCircle size={16} />
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
