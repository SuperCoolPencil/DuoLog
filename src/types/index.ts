export interface Contributor {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category_id: string | null;
  contributor_id: string | null;
  description: string | null;
  date: string;
  // Joined relations
  categories: { name: string } | null;
  contributors: { name: string } | null;
}

export interface NewTransaction {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category_id: string | null;
  contributor_id: string | null;
  description: string;
  date: string;
}
