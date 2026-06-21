import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction, NewTransaction } from '../types';

const SELECT_QUERY = `
  id, type, amount, category_id, contributor_id, description, date,
  categories ( name ),
  contributors ( name )
`;

export interface ContributorStat {
  id: string;
  name: string;
  incomeShare: number;   // their equal cut of total income
  expensesPaid: number;  // what they've personally fronted
  net: number;           // incomeShare - expensesPaid (positive = owed back to them)
}

export interface Settlement {
  from: string;  // contributor name who owes
  to: string;    // contributor name who is owed
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

    // Set up real-time channel
    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        async (payload) => {
          // Fetch full row with joins since postgres_changes doesn't return joined data
          const { data } = await supabase
            .from('transactions')
            .select(SELECT_QUERY)
            .eq('id', payload.new.id)
            .single();
          if (data) {
            setTransactions((prev) => [data as unknown as Transaction, ...prev]);
          }
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
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchAll]);

  const addTransaction = useCallback(async (tx: NewTransaction) => {
    const { error } = await supabase.from('transactions').insert(tx);
    if (error) throw error;
    // Real-time channel will handle the state update
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    // Real-time channel will handle the state update
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────

  const balance = useMemo(() =>
    transactions.reduce((acc, tx) =>
      tx.type === 'INCOME' ? acc + Number(tx.amount) : acc - Number(tx.amount), 0
    ), [transactions]);

  // Per-contributor breakdown:
  //   incomeShare  = totalIncome / numContributors  (equal split, income is shared)
  //   expensesPaid = sum of EXPENSE rows where contributor_id = this person
  //   net          = incomeShare - expensesPaid
  //                  positive → they've paid more than their share, pool owes them
  //                  negative → they haven't paid their share yet
  const contributorStats: ContributorStat[] = useMemo(() => {
    if (contributors.length === 0) return [];

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + Number(t.amount), 0);

    const incomeShareEach = totalIncome / contributors.length;

    const expenseByContributor: Record<string, number> = {};
    for (const c of contributors) expenseByContributor[c.id] = 0;

    for (const tx of transactions) {
      if (tx.type === 'EXPENSE' && tx.contributor_id && tx.contributor_id in expenseByContributor) {
        expenseByContributor[tx.contributor_id] += Number(tx.amount);
      }
    }

    return contributors.map((c) => {
      const expensesPaid = expenseByContributor[c.id] ?? 0;
      const net = incomeShareEach - expensesPaid;
      return { id: c.id, name: c.name, incomeShare: incomeShareEach, expensesPaid, net };
    });
  }, [transactions, contributors]);

  // Settlement: for 2-person case, compute who owes whom.
  // More-negative net → that person has paid less of their fair share.
  const settlement: Settlement | null = useMemo(() => {
    if (contributorStats.length < 2) return null;
    // For N people: find who is most negative (owes most)
    // Simple pairwise for 2-person use case
    const sorted = [...contributorStats].sort((a, b) => a.net - b.net);
    const debtor = sorted[0];   // most negative net = owes
    const creditor = sorted[sorted.length - 1]; // most positive net = owed
    const amount = Math.abs(debtor.net - creditor.net) / 2;
    if (amount < 0.01) return null; // effectively settled
    return { from: debtor.name, to: creditor.name, amount };
  }, [contributorStats]);

  return { transactions, balance, loading, addTransaction, deleteTransaction, contributorStats, settlement };
}

