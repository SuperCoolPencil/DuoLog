import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction, NewTransaction } from '../types';

const SELECT_QUERY = `
  id, type, amount, contributor_id, description, date,
  contributors ( name )
`;

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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(SELECT_QUERY)
      .order('date', { ascending: false });
    if (!error && data) setTransactions(data as unknown as Transaction[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        async (payload) => {
          const { data } = await supabase
            .from('transactions')
            .select(SELECT_QUERY)
            .eq('id', payload.new.id)
            .single();
          if (data) setTransactions((prev) => [data as unknown as Transaction, ...prev]);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions' },
        async (payload) => {
          const { data } = await supabase
            .from('transactions')
            .select(SELECT_QUERY)
            .eq('id', payload.new.id)
            .single();
          if (data) {
            setTransactions((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (data as unknown as Transaction) : t)),
            );
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'transactions' },
        (payload) => {
          setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id));
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [fetchAll]);

  const addTransaction = useCallback(async (tx: NewTransaction) => {
    const { error } = await supabase.from('transactions').insert(tx);
    if (error) throw error;
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
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
    const amount = creditor.netBalance;
    if (amount < 0.01) return null;
    return { from: debtor.name, to: creditor.name, amount };
  }, [contributorStats]);

  return { transactions, balance, loading, addTransaction, deleteTransaction, contributorStats, settlement };
}
