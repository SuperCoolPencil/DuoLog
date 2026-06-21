import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Category } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error && data) setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addCategory = useCallback(async (name: string, type: 'INCOME' | 'EXPENSE') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: trimmed, type })
      .select()
      .single();
    if (!error && data) {
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, []);

  const updateCategory = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { error } = await supabase.from('categories').update({ name: trimmed }).eq('id', id);
    if (!error) {
      setCategories((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, name: trimmed } : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  const incomeCategories = categories.filter((c) => c.type === 'INCOME');
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  return {
    categories,
    incomeCategories,
    expenseCategories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
