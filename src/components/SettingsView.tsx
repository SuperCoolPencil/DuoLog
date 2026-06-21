import { useState, useCallback, type KeyboardEvent, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { Contributor, Category } from '../types';

interface SettingsViewProps {
  contributors: Contributor[];
  categories: Category[];
  onAddContributor: (name: string) => Promise<void>;
  onUpdateContributor: (id: string, name: string) => Promise<void>;
  onDeleteContributor: (id: string) => Promise<void>;
  onAddCategory: (name: string, type: 'INCOME' | 'EXPENSE') => Promise<void>;
  onUpdateCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

// ── Reusable inline-editable list item ──────────────────────────────────────

interface ListItemProps {
  label: string;
  onSave: (value: string) => Promise<void>;
  onDelete: () => Promise<void>;
  idPrefix: string;
}

function ListItem({ label, onSave, onDelete, idPrefix }: ListItemProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!value.trim() || value.trim() === label) {
      setEditing(false);
      setValue(label);
      return;
    }
    setSaving(true);
    try {
      await onSave(value.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [value, label, onSave]);

  const handleCancel = useCallback(() => {
    setValue(label);
    setEditing(false);
  }, [label]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') handleCancel();
    },
    [handleSave, handleCancel],
  );

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
      {editing ? (
        <>
          <input
            id={`${idPrefix}-edit-input`}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-zinc-50 focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
            id={`${idPrefix}-save-btn`}
            aria-label="Save"
          >
            <Check size={14} />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            id={`${idPrefix}-cancel-btn`}
            aria-label="Cancel edit"
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-zinc-200 truncate">{label}</span>
          <button
            onClick={() => setEditing(true)}
            className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
            id={`${idPrefix}-edit-btn`}
            aria-label={`Edit ${label}`}
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-zinc-700 hover:text-rose-400 transition-colors"
            id={`${idPrefix}-delete-btn`}
            aria-label={`Delete ${label}`}
          >
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}

// ── Add-item inline form ──────────────────────────────────────────────────────

interface AddItemFormProps {
  placeholder: string;
  onAdd: (value: string) => Promise<void>;
  idPrefix: string;
}

function AddItemForm({ placeholder, onAdd, idPrefix }: AddItemFormProps) {
  const [value, setValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!value.trim()) return;
      setAdding(true);
      try {
        await onAdd(value.trim());
        setValue('');
        setOpen(false);
      } finally {
        setAdding(false);
      }
    },
    [value, onAdd],
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
        id={`${idPrefix}-add-open-btn`}
      >
        <Plus size={14} />
        Add new
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        id={`${idPrefix}-add-input`}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="input-base flex-1 text-sm"
        autoFocus
      />
      <button
        type="submit"
        disabled={adding || !value.trim()}
        className="shrink-0 btn-primary bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 px-3 py-2 text-xs"
        id={`${idPrefix}-add-submit-btn`}
      >
        {adding ? '…' : 'Add'}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setValue(''); }}
        className="shrink-0 p-2 text-zinc-600 hover:text-zinc-300 transition-colors"
        id={`${idPrefix}-add-cancel-btn`}
        aria-label="Cancel"
      >
        <X size={14} />
      </button>
    </form>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  items: { id: string; name: string }[];
  idPrefix: string;
  addPlaceholder: string;
  onAdd: (name: string) => Promise<void>;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  emptyText: string;
}

function Section({
  title,
  items,
  idPrefix,
  addPlaceholder,
  onAdd,
  onUpdate,
  onDelete,
  emptyText,
}: SectionProps) {
  return (
    <section className="mb-8">
      <p className="section-title">{title}</p>
      <div className="space-y-2 mb-3">
        {items.length === 0 ? (
          <p className="text-xs text-zinc-600 py-1">{emptyText}</p>
        ) : (
          items.map((item) => (
            <ListItem
              key={item.id}
              label={item.name}
              idPrefix={`${idPrefix}-${item.id}`}
              onSave={(name) => onUpdate(item.id, name)}
              onDelete={() => onDelete(item.id)}
            />
          ))
        )}
      </div>
      <AddItemForm placeholder={addPlaceholder} onAdd={onAdd} idPrefix={idPrefix} />
    </section>
  );
}

// ── Main Settings View ────────────────────────────────────────────────────────

export function SettingsView({
  contributors,
  categories,
  onAddContributor,
  onUpdateContributor,
  onDeleteContributor,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: SettingsViewProps) {
  const incomeCategories = categories.filter((c) => c.type === 'INCOME');
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  return (
    <div className="px-4 pt-6 pb-28 overflow-y-auto">
      <Section
        title="Contributors"
        items={contributors}
        idPrefix="contributor"
        addPlaceholder="Contributor name…"
        onAdd={onAddContributor}
        onUpdate={onUpdateContributor}
        onDelete={onDeleteContributor}
        emptyText="No contributors yet. Add the people sharing this ledger."
      />

      <div className="border-t border-zinc-800 mb-8" />

      <Section
        title="Income Categories"
        items={incomeCategories}
        idPrefix="income-cat"
        addPlaceholder="e.g. Sponsorship, Grants…"
        onAdd={(name) => onAddCategory(name, 'INCOME')}
        onUpdate={onUpdateCategory}
        onDelete={onDeleteCategory}
        emptyText="No income categories. Add some to tag your earnings."
      />

      <div className="border-t border-zinc-800 mb-8" />

      <Section
        title="Expense Categories"
        items={expenseCategories}
        idPrefix="expense-cat"
        addPlaceholder="e.g. Hosting, Domains…"
        onAdd={(name) => onAddCategory(name, 'EXPENSE')}
        onUpdate={onUpdateCategory}
        onDelete={onDeleteCategory}
        emptyText="No expense categories. Add some to tag your spending."
      />
    </div>
  );
}
