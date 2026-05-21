'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import { apiFetch } from '@/utils/api';

const BRAIN_URL = process.env.NEXT_PUBLIC_BRAIN_URL || 'https://api.jmkfacilities.ie/api/brain';

const COUNTRIES = ['Ireland', 'UK', 'Other'] as const;
const BRANDS    = ['Marriott', 'Hilton', 'IHG', 'Independent', 'Other'] as const;

type Country = (typeof COUNTRIES)[number];
type Brand   = (typeof BRANDS)[number];

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
}

interface CreatedProject {
  hotel_id: string;
  rule_scope: string[];
}

type Step = 'form' | 'confirm';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewProjectModal({ open, onClose }: NewProjectModalProps) {
  const router = useRouter();

  const [step, setStep]               = useState<Step>('form');
  const [name, setName]               = useState('');
  const [country, setCountry]         = useState<Country>('Ireland');
  const [brand, setBrand]             = useState<Brand>('Marriott');
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [created, setCreated]         = useState<CreatedProject | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  const autoSlug = useMemo(() => slugify(name), [name]);
  const effectiveSlug = slugOverride ?? autoSlug;

  useEffect(() => {
    if (!open) return;
    setStep('form');
    setName('');
    setCountry('Ireland');
    setBrand('Marriott');
    setSlugOverride(null);
    setSubmitting(false);
    setError(null);
    setCreated(null);
    const t = setTimeout(() => nameRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0 && effectiveSlug.length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const body = {
        project_name: name.trim(),
        country,
        brand,
        hotel_id: effectiveSlug,
      };
      const res = await apiFetch(`${BRAIN_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        setError('A project with this name already exists, try a different name.');
        return;
      }

      if (!res.ok) {
        let message = `Request failed (${res.status}).`;
        try {
          const data = await res.json();
          message = data?.detail ?? data?.message ?? data?.error ?? message;
        } catch { /* non-json body */ }
        setError(message);
        return;
      }

      const data = await res.json();
      const hotelId: string   = data.hotel_id ?? effectiveSlug;
      const ruleScope: string[] = Array.isArray(data.rule_scope) ? data.rule_scope : [];
      setCreated({ hotel_id: hotelId, rule_scope: ruleScope });
      setStep('confirm');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleContinue() {
    if (!created) return;
    onClose();
    router.push(`/projects/${created.hotel_id}`);
  }

  return (
    <div
      onClick={() => !submitting && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(15,23,42,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        style={{
          width: '100%', maxWidth: 480,
          backgroundColor: '#ffffff', borderRadius: 14,
          boxShadow: '0 24px 48px rgba(15,23,42,0.18)',
          border: '1px solid #e5e7eb',
          fontFamily: 'inherit', color: '#0f172a',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px 14px', borderBottom: '1px solid #f1f5f9',
        }}>
          <h2 id="new-project-title" style={{
            margin: 0, fontSize: 17, fontWeight: 700,
            color: '#0f172a', letterSpacing: '-0.02em',
          }}>
            {step === 'form' ? 'New Project' : 'Confirm rule scope'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            style={{
              background: 'none', border: 'none',
              cursor: submitting ? 'default' : 'pointer',
              padding: 6, borderRadius: 6, color: '#64748b',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {step === 'form' ? (
          <form onSubmit={handleSubmit} style={{ padding: '18px 22px 22px' }}>
            <Field label="Project name" htmlFor="np-name" required>
              <input
                ref={nameRef}
                id="np-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aloft Cork"
                autoComplete="off"
                required
                style={inputStyle}
              />
              <p style={hintStyle}>
                Hotel ID:{' '}
                <code style={codeStyle}>{effectiveSlug || '—'}</code>
                {slugOverride === null && name.length > 0 && (
                  <>
                    {' '}·{' '}
                    <button
                      type="button"
                      onClick={() => setSlugOverride(autoSlug)}
                      style={linkButtonStyle}
                    >
                      override
                    </button>
                  </>
                )}
              </p>
              {slugOverride !== null && (
                <input
                  type="text"
                  value={slugOverride}
                  onChange={(e) => setSlugOverride(slugify(e.target.value))}
                  placeholder="aloft-cork"
                  style={{ ...inputStyle, marginTop: 6 }}
                />
              )}
            </Field>

            <Field label="Country" htmlFor="np-country" required>
              <select
                id="np-country"
                value={country}
                onChange={(e) => setCountry(e.target.value as Country)}
                style={inputStyle}
              >
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Brand" htmlFor="np-brand" required>
              <select
                id="np-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value as Brand)}
                style={inputStyle}
              >
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>

            {error && (
              <div role="alert" style={{
                marginTop: 14, padding: '10px 12px', borderRadius: 8,
                backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                color: '#b91c1c', fontSize: 13, lineHeight: 1.45,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  ...primaryButtonStyle,
                  opacity: canSubmit ? 1 : 0.55,
                  cursor: canSubmit ? 'pointer' : 'default',
                }}
              >
                {submitting && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {submitting ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '18px 22px 22px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: '#334155', lineHeight: 1.55 }}>
              This project will load rules for:
            </p>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6,
              marginBottom: 16,
            }}>
              {(created?.rule_scope ?? []).map((scope) => (
                <span
                  key={scope}
                  style={{
                    fontSize: 12, fontWeight: 600,
                    backgroundColor: '#eff6ff', color: '#1d4ed8',
                    border: '1px solid #dbeafe',
                    padding: '4px 10px', borderRadius: 9999,
                  }}
                >
                  {scope}
                </span>
              ))}
              {(!created?.rule_scope || created.rule_scope.length === 0) && (
                <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                  No scopes returned.
                </span>
              )}
            </div>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b', lineHeight: 1.55 }}>
              Continue to open the new project?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setStep('form')}
                style={secondaryButtonStyle}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinue}
                style={primaryButtonStyle}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Subcomponents & styles ─────────────────────────────────────────────────

function Field({
  label, htmlFor, required, children,
}: { label: string; htmlFor: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block', fontSize: 12, fontWeight: 600,
          color: '#475569', marginBottom: 6,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}
      >
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', borderRadius: 8,
  border: '1px solid #d1d5db', backgroundColor: '#ffffff',
  fontSize: 14, color: '#0f172a', fontFamily: 'inherit',
  outline: 'none',
};

const hintStyle: React.CSSProperties = {
  margin: '6px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.5,
};

const codeStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  backgroundColor: '#f1f5f9', color: '#0f172a',
  padding: '1px 6px', borderRadius: 4, fontSize: 12,
};

const linkButtonStyle: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0,
  color: '#2563eb', fontSize: 12, cursor: 'pointer',
  fontFamily: 'inherit', textDecoration: 'underline',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 8, border: 'none',
  backgroundColor: '#c96442', color: '#ffffff',
  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8,
  border: '1px solid #d1d5db', backgroundColor: '#ffffff',
  color: '#475569', fontSize: 13, fontWeight: 500,
  fontFamily: 'inherit', cursor: 'pointer',
};
