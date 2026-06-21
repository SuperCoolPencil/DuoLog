import { useState } from 'react';
import { BookOpen, Settings } from 'lucide-react';
import { BalanceHeader } from './components/BalanceHeader';
import { TransactionForm } from './components/TransactionForm';
import { TransactionFeed } from './components/TransactionFeed';
import { SettingsView } from './components/SettingsView';
import { SplitView } from './components/SplitView';
import { useTransactions } from './hooks/useTransactions';
import { useContributors } from './hooks/useContributors';

type Tab = 'ledger' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ledger');

  const {
    contributors,
    addContributor,
    updateContributor,
    deleteContributor,
  } = useContributors();

  const {
    transactions,
    balance,
    loading: txLoading,
    addTransaction,
    deleteTransaction,
    contributorStats,
    settlement,
  } = useTransactions(contributors);

  return (
    <div className="flex flex-col h-dvh bg-zinc-950 text-zinc-50 max-w-lg mx-auto">
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'ledger' ? (
          <>
            <BalanceHeader balance={balance} loading={txLoading} />
            <SplitView stats={contributorStats} settlement={settlement} />
            <TransactionForm contributors={contributors} onAdd={addTransaction} />
            <TransactionFeed
              transactions={transactions}
              loading={txLoading}
              onDelete={deleteTransaction}
            />
          </>
        ) : (
          <>
            <div className="px-4 pt-6 pb-2 border-b border-zinc-800">
              <h1 className="text-lg font-semibold text-zinc-50">Settings</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Manage contributors</p>
            </div>
            <SettingsView
              contributors={contributors}
              onAddContributor={addContributor}
              onUpdateContributor={updateContributor}
              onDeleteContributor={deleteContributor}
            />
          </>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav
        className="shrink-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm grid grid-cols-2 safe-bottom"
        aria-label="Main navigation"
      >
        <button
          id="tab-ledger"
          onClick={() => setActiveTab('ledger')}
          aria-selected={activeTab === 'ledger'}
          role="tab"
          className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
            activeTab === 'ledger'
              ? 'text-zinc-50 border-t-2 border-zinc-50 -mt-px'
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          <BookOpen size={20} strokeWidth={activeTab === 'ledger' ? 2.5 : 1.5} />
          Ledger
        </button>

        <button
          id="tab-settings"
          onClick={() => setActiveTab('settings')}
          aria-selected={activeTab === 'settings'}
          role="tab"
          className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-zinc-50 border-t-2 border-zinc-50 -mt-px'
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          <Settings size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 1.5} />
          Settings
        </button>
      </nav>
    </div>
  );
}
