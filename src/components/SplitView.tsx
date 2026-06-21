import { ArrowRight, Users } from 'lucide-react';
import type { ContributorStat, Settlement } from '../hooks/useTransactions';

interface SplitViewProps {
  stats: ContributorStat[];
  settlement: Settlement | null;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function SplitView({ stats, settlement }: SplitViewProps) {
  if (stats.length === 0) {
    return (
      <div className="mx-4 mb-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div className="flex items-center gap-2 text-zinc-600 text-xs">
          <Users size={13} />
          <span>Add contributors in Settings to see the balance split.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-1 rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Per-person rows */}
      <div className={`divide-y divide-zinc-800/60 ${stats.length > 1 ? '' : ''}`}>
        {stats.map((s) => {
          const isAhead = s.net >= 0;
          return (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-zinc-300 uppercase">
                  {s.name.charAt(0)}
                </span>
              </div>

              {/* Name + breakdown */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{s.name}</p>
                <p className="text-xs text-zinc-600 mono">
                  Fronted {formatINR(s.expensesPaid)}
                  {' · '}
                  Share {formatINR(s.incomeShare)}
                </p>
              </div>

              {/* Net position badge */}
              <div
                className={`shrink-0 flex items-center gap-1 rounded-md px-2 py-1 ${
                  isAhead
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                <span className="mono text-xs font-semibold">
                  {isAhead ? '+' : '−'}
                  {formatINR(s.net)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Settlement row */}
      {settlement && (
        <div className="border-t border-zinc-800 bg-amber-500/5 px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-amber-400/80">Settle up:</span>
          <span className="text-xs font-medium text-amber-300 mono">{settlement.from}</span>
          <ArrowRight size={11} className="text-amber-500/60 shrink-0" />
          <span className="text-xs font-medium text-amber-300 mono">{settlement.to}</span>
          <span className="ml-auto mono text-xs font-semibold text-amber-400">
            {formatINR(settlement.amount)}
          </span>
        </div>
      )}

      {/* Settled indicator */}
      {!settlement && stats.length >= 2 && (
        <div className="border-t border-zinc-800 px-4 py-2">
          <span className="text-xs text-emerald-500/70">✓ Balanced — no settlement needed</span>
        </div>
      )}
    </div>
  );
}
