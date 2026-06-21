import { useState, useCallback } from 'react';
import { Trash2, ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react';
import type { Transaction } from '../types';

interface TransactionFeedProps {
  transactions: Transaction[];
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
}

function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

function formatDateFull(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // don't toggle expand when tapping delete
    setConfirmId(id);
  }, []);

  const handleConfirmDelete = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
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

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmId(null);
  }, []);

  if (loading) {
    return (
      <div className="px-4 space-y-3 py-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800"
          />
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
      <p className="section-title pt-2">
        {transactions.length} Transaction{transactions.length !== 1 ? 's' : ''}
      </p>

      {transactions.map((tx) => {
        const isIncome = tx.type === 'INCOME';
        const isDeleting = deletingId === tx.id;
        const isConfirming = confirmId === tx.id;
        const isExpanded = expandedId === tx.id;

        return (
          <article
            key={tx.id}
            className={`relative card overflow-hidden transition-opacity duration-150 ${isDeleting ? 'opacity-40' : ''}`}
            aria-label={`${isIncome ? 'Income' : 'Expense'}: ${formatINR(tx.amount)}`}
          >
            {/* Left accent bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-0.5 ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />

            {/* Main row — tappable */}
            <button
              type="button"
              onClick={() => toggleExpand(tx.id)}
              className="w-full text-left pl-4 pr-3 py-3 flex items-center gap-3"
              id={`tx-row-${tx.id}`}
              aria-expanded={isExpanded}
            >
              {/* Type icon */}
              <div
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate">
                  {tx.description || (isIncome ? 'Income' : 'Expense')}
                </p>
                <p className="text-xs text-zinc-600 mono mt-0.5">
                  {formatDateShort(tx.date)}
                  {tx.contributors?.name && (
                    <span className="text-zinc-700"> · {tx.contributors.name}</span>
                  )}
                </p>
              </div>

              {/* Amount + chevron */}
              <div className="shrink-0 flex items-center gap-2">
                <span
                  className={`mono text-sm font-semibold ${
                    isIncome ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isIncome ? '+' : '−'}
                  {formatINR(tx.amount)}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-zinc-700 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* Expanded detail panel */}
            {isExpanded && (
              <div className="border-t border-zinc-800 pl-4 pr-3 py-3 bg-zinc-900/60 space-y-2.5">
                {/* Full description */}
                <div>
                  <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium mb-0.5">
                    Description
                  </p>
                  <p className="text-sm text-zinc-300">
                    {tx.description || <span className="text-zinc-600 italic">No description</span>}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Contributor */}
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium mb-0.5">
                      {isIncome ? 'Received by' : 'Paid by'}
                    </p>
                    <p className="text-sm text-zinc-300">
                      {tx.contributors?.name ?? <span className="text-zinc-600">—</span>}
                    </p>
                  </div>

                  {/* Type */}
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium mb-0.5">
                      Type
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {isIncome ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {isIncome ? 'Income' : 'Expense'}
                    </span>
                  </div>

                  {/* Exact amount */}
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium mb-0.5">
                      Amount
                    </p>
                    <p className={`mono text-sm font-semibold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isIncome ? '+' : '−'}{formatINR(tx.amount)}
                    </p>
                  </div>

                  {/* Full date */}
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium mb-0.5">
                      Date
                    </p>
                    <p className="mono text-xs text-zinc-400 leading-relaxed">
                      {formatDateFull(tx.date)}
                    </p>
                  </div>
                </div>

                {/* Delete controls */}
                <div className="pt-1 flex justify-end">
                  {isConfirming ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Delete this entry?</span>
                      <button
                        onClick={handleCancelDelete}
                        className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded border border-zinc-800 transition-colors"
                        id={`cancel-delete-${tx.id}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => handleConfirmDelete(e, tx.id)}
                        className="text-xs text-rose-400 px-2 py-1 rounded border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                        id={`confirm-delete-${tx.id}`}
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleDeleteClick(e, tx.id)}
                      className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-rose-500/10"
                      id={`delete-${tx.id}`}
                      disabled={isDeleting}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
