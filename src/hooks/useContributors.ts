import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Contributor } from '../types';

export function useContributors() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('contributors')
      .select('*')
      .order('name');
    if (!error && data) setContributors(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addContributor = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { data, error } = await supabase
      .from('contributors')
      .insert({ name: trimmed })
      .select()
      .single();
    if (!error && data) {
      setContributors((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, []);

  const updateContributor = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { error } = await supabase.from('contributors').update({ name: trimmed }).eq('id', id);
    if (!error) {
      setContributors((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, name: trimmed } : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    }
  }, []);

  const deleteContributor = useCallback(async (id: string) => {
    const { error } = await supabase.from('contributors').delete().eq('id', id);
    if (!error) {
      setContributors((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  return { contributors, loading, addContributor, updateContributor, deleteContributor };
}
