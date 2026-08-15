import type { Contributor, NewTransaction, Transaction } from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Could not reach the ledger database.');
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

export const ledgerApi = {
  contributors: () => request<Contributor[]>('/api/contributors'),
  addContributor: (name: string) => request<Contributor>('/api/contributors', {
    method: 'POST', body: JSON.stringify({ name }),
  }),
  updateContributor: (id: string, name: string) => request<Contributor>('/api/contributors', {
    method: 'PATCH', body: JSON.stringify({ id, name }),
  }),
  deleteContributor: (id: string) => request<void>(`/api/contributors?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }),
  transactions: () => request<Transaction[]>('/api/transactions'),
  addTransaction: (transaction: NewTransaction) => request<Transaction>('/api/transactions', {
    method: 'POST', body: JSON.stringify(transaction),
  }),
  deleteTransaction: (id: string) => request<void>(`/api/transactions?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }),
};
