import { useState, useEffect, useCallback } from 'react';
import { ledgerApi } from '../lib/api';
import type { Contributor } from '../types';

export function useContributors() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setContributors(await ledgerApi.contributors());
      setError(null);
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError : new Error('Unable to load contributors'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetch(), 0);
    return () => window.clearTimeout(timer);
  }, [fetch]);

  const addContributor = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const contributor = await ledgerApi.addContributor(trimmed);
    setContributors((prev) => [...prev, contributor].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const updateContributor = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await ledgerApi.updateContributor(id, trimmed);
    setContributors((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, name: trimmed } : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }, []);

  const deleteContributor = useCallback(async (id: string) => {
    await ledgerApi.deleteContributor(id);
    setContributors((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { contributors, loading, error, addContributor, updateContributor, deleteContributor };
}
