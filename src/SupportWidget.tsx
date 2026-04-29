import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { SupportClient, type SupportConfig, type SupportLookupItem, type SupportTicketDraft } from './client';

export interface SupportWidgetProps {
  config: SupportConfig;
  /** Override the default bottom-right anchor. */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Override the FAB colour (CSS colour). */
  accentColor?: string;
  /** Override label text per locale. Keys must match `defaultStrings` keys. */
  strings?: Partial<typeof defaultStrings>;
}

const defaultStrings = {
  reportIssue: 'Report an issue',
  whatHappened: 'What happened?',
  titlePlaceholder: 'Short summary',
  descriptionPlaceholder: 'Tell us what went wrong, what you were trying to do, and any steps to reproduce.',
  category: 'Category',
  selectCategory: 'Select a category',
  priority: 'Priority',
  selectPriority: 'Select a priority',
  cancel: 'Cancel',
  submit: 'Submit',
  close: 'Close',
  success: 'Thanks — we got it.',
  successDetail: 'A real human will look into this and get back to you.',
};

export function SupportWidget({ config, position = 'bottom-right', accentColor = '#2185d0', strings }: SupportWidgetProps) {
  const t = { ...defaultStrings, ...(strings ?? {}) };
  const [client] = useState(() => new SupportClient(config));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SupportTicketDraft>({ title: '', description: '' });
  const [categories, setCategories] = useState<SupportLookupItem[]>([]);
  const [priorities, setPriorities] = useState<SupportLookupItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open || categories.length || priorities.length) return;
    Promise.all([client.categories(), client.priorities()])
      .then(([cats, prios]) => {
        setCategories(cats);
        setPriorities(prios);
      })
      .catch((e: Error) => setError(e.message));
  }, [open, client, categories.length, priorities.length]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      await client.createTicket(draft);
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }, [client, draft]);

  const reset = () => {
    setOpen(false);
    setDone(false);
    setDraft({ title: '', description: '' });
    setError(null);
  };

  const canSubmit = draft.title.trim() && draft.description.trim() && !submitting;

  const fabStyle = positionStyle(position);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.reportIssue}
        style={{ ...fabStyle, ...fabBaseStyle, background: accentColor }}
      >
        <LifeRingIcon />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" style={overlayStyle} onClick={reset}>
          <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div style={{ padding: 24 }}>
                <h3 style={{ marginTop: 0 }}>{t.success}</h3>
                <p style={{ color: '#444' }}>{t.successDetail}</p>
                <button style={primaryButton(accentColor)} onClick={reset}>
                  {t.close}
                </button>
              </div>
            ) : (
              <form
                style={{ padding: 24 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canSubmit) submit();
                }}
              >
                <h3 style={{ marginTop: 0 }}>{t.reportIssue}</h3>
                <label style={labelStyle}>
                  <span>{t.whatHappened}</span>
                  <input
                    type="text"
                    placeholder={t.titlePlaceholder}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    style={inputStyle}
                    autoFocus
                  />
                </label>
                <textarea
                  rows={5}
                  placeholder={t.descriptionPlaceholder}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                />
                {!!categories.length && (
                  <label style={labelStyle}>
                    <span>{t.category}</span>
                    <select
                      value={draft.categoryId ?? ''}
                      onChange={(e) => setDraft({ ...draft, categoryId: e.target.value || undefined })}
                      style={inputStyle}
                    >
                      <option value="">{t.selectCategory}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {!!priorities.length && (
                  <label style={labelStyle}>
                    <span>{t.priority}</span>
                    <select
                      value={draft.priorityId ?? ''}
                      onChange={(e) => setDraft({ ...draft, priorityId: e.target.value || undefined })}
                      style={inputStyle}
                    >
                      <option value="">{t.selectPriority}</option>
                      {priorities.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {error && <p style={{ color: '#db2828', fontSize: 13 }}>{error}</p>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button type="button" style={secondaryButton} onClick={reset}>
                    {t.cancel}
                  </button>
                  <button type="submit" style={primaryButton(accentColor)} disabled={!canSubmit}>
                    {t.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const LifeRingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <path d="m4.93 4.93 4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M14.83 9.17l3.53-3.53M4.93 19.07l4.24-4.24" />
  </svg>
);

const positionStyle = (p: SupportWidgetProps['position']): CSSProperties => {
  const off = '20px';
  switch (p) {
    case 'bottom-left':
      return { bottom: off, left: off };
    case 'top-right':
      return { top: off, right: off };
    case 'top-left':
      return { top: off, left: off };
    default:
      return { bottom: off, right: off };
  }
};

const fabBaseStyle: CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  width: 56,
  height: 56,
  borderRadius: '50%',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(0,0,0,.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  background: 'rgba(0,0,0,.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

const panelStyle: CSSProperties = {
  background: '#fff',
  color: '#222',
  borderRadius: 12,
  width: '100%',
  maxWidth: 480,
  boxShadow: '0 20px 50px rgba(0,0,0,.4)',
};

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginBottom: 12,
  fontSize: 14,
  color: '#555',
};

const inputStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #ccc',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
};

const primaryButton = (color: string): CSSProperties => ({
  padding: '10px 18px',
  borderRadius: 8,
  border: 'none',
  background: color,
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
});

const secondaryButton: CSSProperties = {
  padding: '10px 18px',
  borderRadius: 8,
  border: '1px solid #ccc',
  background: '#fff',
  color: '#333',
  cursor: 'pointer',
};
