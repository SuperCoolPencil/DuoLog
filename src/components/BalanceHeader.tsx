import { TrendingUp, TrendingDown } from 'lucide-react';

interface BalanceHeaderProps {
  balance: number;
  loading: boolean;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function BalanceHeader({ balance, loading }: BalanceHeaderProps) {
  const isPositive = balance >= 0;
  const balanceColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
  const prefix = balance < 0 ? '−' : '';

  return (
    <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm px-4 py-5 safe-top">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Shared Balance
        </span>
        {isPositive ? (
          <TrendingUp size={14} className="text-emerald-500" />
        ) : (
          <TrendingDown size={14} className="text-rose-500" />
        )}
      </div>

      {loading ? (
        <div className="h-10 w-48 rounded-md bg-zinc-800 animate-pulse" />
      ) : (
        <div className={`mono text-4xl font-semibold tracking-tight ${balanceColor}`}>
          {prefix}
          {formatINR(balance)}
        </div>
      )}
    </div>
  );
}
