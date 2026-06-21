export interface Contributor {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  contributor_id: string | null;
  description: string | null;
  date: string;
  // Joined relation
  contributors: { name: string } | null;
}

export interface NewTransaction {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  contributor_id: string;
  description: string;
  date: string;
}
