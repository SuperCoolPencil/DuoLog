import { useState, useEffect, useCallback, useMemo } from 'react';
import { ledgerApi } from '../lib/api';
import type { Transaction, NewTransaction } from '../types';

export interface ContributorStat {
  id: string;
  name: string;
  incomeReceived: number;
  expensesPaid: number;
  netBalance: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function useTransactions(contributors: { id: string; name: string }[]) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setTransactions(await ledgerApi.transactions());
      setError(null);
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError : new Error('Unable to load transactions'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => void fetchAll(), 0);
    const interval = window.setInterval(() => void fetchAll(), 15_000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [fetchAll]);

  const addTransaction = useCallback(async (tx: NewTransaction) => {
    const transaction = await ledgerApi.addTransaction(tx);
    setTransactions((prev) => [transaction, ...prev]);
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    await ledgerApi.deleteTransaction(id);
    setTransactions((prev) => prev.filter((transaction) => transaction.id !== id));
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const balance = useMemo(
    () =>
      transactions.reduce(
        (acc, tx) => (tx.type === 'INCOME' ? acc + Number(tx.amount) : acc - Number(tx.amount)),
        0,
      ),
    [transactions],
  );

  const contributorStats: ContributorStat[] = useMemo(() => {
    if (contributors.length === 0) return [];

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + Number(t.amount), 0);

    const totalNetWorth = totalIncome - totalExpense;
    const fairShare = totalNetWorth / contributors.length;

    const expenseByContributor: Record<string, number> = {};
    const incomeByContributor: Record<string, number> = {};
    for (const c of contributors) {
      expenseByContributor[c.id] = 0;
      incomeByContributor[c.id] = 0;
    }

    for (const tx of transactions) {
      if (tx.contributor_id) {
        if (tx.type === 'EXPENSE' && tx.contributor_id in expenseByContributor) {
          expenseByContributor[tx.contributor_id] += Number(tx.amount);
        } else if (tx.type === 'INCOME' && tx.contributor_id in incomeByContributor) {
          incomeByContributor[tx.contributor_id] += Number(tx.amount);
        }
      }
    }

    return contributors.map((c) => {
      const expensesPaid = expenseByContributor[c.id] ?? 0;
      const incomeReceived = incomeByContributor[c.id] ?? 0;
      const heldAmount = incomeReceived - expensesPaid;
      const netBalance = fairShare - heldAmount;
      return { id: c.id, name: c.name, incomeReceived, expensesPaid, netBalance };
    });
  }, [transactions, contributors]);

  const settlement: Settlement | null = useMemo(() => {
    if (contributorStats.length < 2) return null;
    const sorted = [...contributorStats].sort((a, b) => a.netBalance - b.netBalance);
    const debtor = sorted[0]; // Most negative netBalance (Owes money)
    const creditor = sorted[sorted.length - 1]; // Most positive netBalance (Owed money)
    const amount = Math.min(Math.abs(debtor.netBalance), creditor.netBalance);
    if (amount < 0.01) return null;
    return { from: debtor.name, to: creditor.name, amount };
  }, [contributorStats]);

  return {
    transactions,
    balance,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    contributorStats,
    settlement,
  };
}
