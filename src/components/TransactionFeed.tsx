import { useState, useCallback } from 'react';
import { Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Transaction } from '../types';

interface TransactionFeedProps {
  transactions: Transaction[];
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function TransactionFeed({ transactions, loading, onDelete }: TransactionFeedProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDeleteClick = useCallback((id: string) => {
    setConfirmId(id);
  }, []);

  const handleConfirmDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      setConfirmId(null);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete],
  );

  if (loading) {
    return (
      <div className="px-4 space-y-3 py-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <span className="text-2xl">📒</span>
        </div>
        <p className="text-zinc-400 font-medium mb-1">No transactions yet</p>
        <p className="text-zinc-600 text-sm">
          Tap "Add Funds" or "Withdraw" to log the first entry.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-2 space-y-2">
      <p className="section-title pt-2">{transactions.length} Transaction{transactions.length !== 1 ? 's' : ''}</p>

      {transactions.map((tx) => {
        const isIncome = tx.type === 'INCOME';
        const isDeleting = deletingId === tx.id;
        const isConfirming = confirmId === tx.id;

        return (
          <article
            key={tx.id}
            className={`relative card overflow-hidden transition-opacity duration-150 ${isDeleting ? 'opacity-40' : ''}`}
            aria-label={`${tx.type === 'INCOME' ? 'Income' : 'Expense'}: ${formatINR(tx.amount)}`}
          >
            {/* Left border accent */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-0.5 ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />

            <div className="pl-4 pr-3 py-3 flex items-start gap-3">
              {/* Icon */}
              <div
                className={`shrink-0 mt-0.5 w-7 h-7 rounded-md flex items-center justify-center ${
                  isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">
                      {tx.categories?.name ?? 'Uncategorized'}
                    </p>
                    {tx.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{tx.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-600 mono">{formatDate(tx.date)}</span>
                      {tx.contributors?.name && (
                        <>
                          <span className="text-zinc-800 text-xs">·</span>
                          <span className="text-xs text-zinc-500">{tx.contributors.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0 text-right">
                    <span
                      className={`mono text-sm font-semibold ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {formatINR(tx.amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete controls */}
              <div className="shrink-0 flex items-center gap-1 ml-1">
                {isConfirming ? (
                  <>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors"
                      id={`cancel-delete-${tx.id}`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => handleConfirmDelete(tx.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded border border-rose-500/20 bg-rose-500/10 transition-colors"
                      id={`confirm-delete-${tx.id}`}
                      disabled={isDeleting}
                    >
                      Yes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleDeleteClick(tx.id)}
                    className="p-1.5 rounded-md text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    aria-label="Delete transaction"
                    id={`delete-${tx.id}`}
                    disabled={isDeleting}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
