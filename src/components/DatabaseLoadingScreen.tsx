import { Database, LoaderCircle } from 'lucide-react';

interface DatabaseLoadingScreenProps {
  isTakingLonger: boolean;
  hasLoadError: boolean;
}

export function DatabaseLoadingScreen({
  isTakingLonger,
  hasLoadError,
}: DatabaseLoadingScreenProps) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center text-zinc-50"
      role="status"
      aria-live="polite"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
        <Database size={25} className="text-zinc-200" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-lg font-semibold">Opening DuoLog</h1>
        <p className="mt-1 max-w-xs text-sm leading-6 text-zinc-500">
          {hasLoadError
            ? 'We could not reach the database. If this is a paused Supabase Free project, its owner must resume it in Supabase Studio.'
            : isTakingLonger
              ? 'Still connecting to your shared ledger…'
            : 'Connecting to your shared ledger…'}
        </p>
      </div>
      {!hasLoadError && (
        <LoaderCircle className="animate-spin text-zinc-400" size={22} aria-hidden="true" />
      )}
      {hasLoadError && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
        >
          Try again
        </button>
      )}
    </div>
  );
}
