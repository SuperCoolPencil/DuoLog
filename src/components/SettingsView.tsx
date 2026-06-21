import { useState, useCallback, type KeyboardEvent, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { Contributor } from '../types';

interface SettingsViewProps {
  contributors: Contributor[];
  onAddContributor: (name: string) => Promise<void>;
  onUpdateContributor: (id: string, name: string) => Promise<void>;
  onDeleteContributor: (id: string) => Promise<void>;
}

// ── Inline-editable list item ────────────────────────────────────────────────

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
    if (!value.trim() || value.trim() === label) { setEditing(false); setValue(label); return; }
    setSaving(true);
    try { await onSave(value.trim()); setEditing(false); } finally { setSaving(false); }
  }, [value, label, onSave]);

  const handleCancel = useCallback(() => { setValue(label); setEditing(false); }, [label]);

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
          <button onClick={handleSave} disabled={saving} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors" id={`${idPrefix}-save-btn`} aria-label="Save">
            <Check size={14} />
          </button>
          <button onClick={handleCancel} className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors" id={`${idPrefix}-cancel-btn`} aria-label="Cancel">
            <X size={14} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-zinc-200 truncate">{label}</span>
          <button onClick={() => setEditing(true)} className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors" id={`${idPrefix}-edit-btn`} aria-label={`Edit ${label}`}>
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1 text-zinc-700 hover:text-rose-400 transition-colors" id={`${idPrefix}-delete-btn`} aria-label={`Delete ${label}`}>
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}

// ── Add-item inline form ─────────────────────────────────────────────────────

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
      try { await onAdd(value.trim()); setValue(''); setOpen(false); } finally { setAdding(false); }
    },
    [value, onAdd],
  );

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1" id={`${idPrefix}-add-open-btn`}>
        <Plus size={14} /> Add new
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
      <button type="submit" disabled={adding || !value.trim()} className="shrink-0 btn-primary bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 px-3 py-2 text-xs" id={`${idPrefix}-add-submit-btn`}>
        {adding ? '…' : 'Add'}
      </button>
      <button type="button" onClick={() => { setOpen(false); setValue(''); }} className="shrink-0 p-2 text-zinc-600 hover:text-zinc-300 transition-colors" id={`${idPrefix}-add-cancel-btn`} aria-label="Cancel">
        <X size={14} />
      </button>
    </form>
  );
}

// ── Main Settings View ────────────────────────────────────────────────────────

export function SettingsView({
  contributors,
  onAddContributor,
  onUpdateContributor,
  onDeleteContributor,
}: SettingsViewProps) {
  return (
    <div className="px-4 pt-6 pb-28 overflow-y-auto">
      <section>
        <p className="section-title">Contributors</p>
        <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
          Every transaction must be attributed to a contributor. Income is split equally between all contributors for balance calculations.
        </p>
        <div className="space-y-2 mb-3">
          {contributors.length === 0 ? (
            <p className="text-xs text-zinc-600 py-1">No contributors yet. Add the people sharing this ledger.</p>
          ) : (
            contributors.map((c) => (
              <ListItem
                key={c.id}
                label={c.name}
                idPrefix={`contributor-${c.id}`}
                onSave={(name) => onUpdateContributor(c.id, name)}
                onDelete={() => onDeleteContributor(c.id)}
              />
            ))
          )}
        </div>
        <AddItemForm placeholder="Contributor name…" onAdd={onAddContributor} idPrefix="contributor" />
      </section>
    </div>
  );
}
