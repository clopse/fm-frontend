'use client';

import { Fragment, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Search, Plus } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import UserPanel from '@/components/UserPanel';
import HotelSelectorModal from '@/components/HotelSelectorModal';
import { apiFetch } from '@/utils/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const HOTELS = ['galway', 'hiex', 'hbhdcc', 'hiltonth', 'hida', 'belfast', 'moxy', 'marina', 'hbhe', 'kensh'];
const CATEGORY_ORDER = ['JMK Master', 'Site Specific', 'Brand Standard', 'Uncategorised'];

const CATEGORY_STYLE: Record<string, CSSProperties> = {
  'JMK Master':    { backgroundColor: '#1e3a5f', color: '#fff' },
  'Site Specific': { backgroundColor: '#166534', color: '#fff' },
  'Brand Standard':{ backgroundColor: '#991b1b', color: '#fff' },
  'Uncategorised': { backgroundColor: '#475569', color: '#fff' },
};

const PRIORITY_STYLE: Record<string, CSSProperties> = {
  'Critical': { backgroundColor: '#dc2626', color: '#fff' },
  'High':     { backgroundColor: '#ea580c', color: '#fff' },
  'Medium':   { backgroundColor: '#d97706', color: '#fff' },
  'Low':      { backgroundColor: '#94a3b8', color: '#fff' },
};

// ── Data model ────────────────────────────────────────────────────────────────

interface Rule {
  id: number;
  title: string | null;
  description: string;
  rule_category: string | null;
  source: string | null;
  hotel_id: string | null;
  priority: string | null;
  active: boolean;
  updated_at: string;
}

interface ModalForm {
  title: string;
  rule_category: string;
  hotel_id: string;
  priority: string;
  source: string;
  description: string;
  active: boolean;
}

const EMPTY_FORM: ModalForm = {
  title: '', rule_category: '', hotel_id: '', priority: '',
  source: '', description: '', active: true,
};

// ── Derivation helpers ────────────────────────────────────────────────────────

function displayTitle(rule: Rule): string {
  if (rule.title) return rule.title;
  return rule.description.slice(0, 80) + (rule.description.length > 80 ? '...' : '');
}

function displayCategory(rule: Rule): string {
  if (rule.rule_category) return rule.rule_category;
  const src = rule.source ?? '';
  if (src.includes('JMK')) return 'JMK Master';
  if (src.includes('Marriott') || src.includes('Aloft')) return 'Brand Standard';
  return 'Uncategorised';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RulesPage() {
  // Sidebar / layout
  const [showAdminSidebar, setShowAdminSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // Data
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [activeOnly, setActiveOnly] = useState(true);

  // Table interactions
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [deactivateConfirm, setDeactivateConfirm] = useState<number | null>(null);

  // Modal
  const [modalState, setModalState] = useState<null | { mode: 'add' } | { mode: 'edit'; rule: Rule }>(null);
  const [form, setForm] = useState<ModalForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setShowAdminSidebar(!mobile);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/api/rules`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRules(Array.isArray(data) ? data : (data.rules ?? []));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  // Derived
  const distinctSources = useMemo(
    () => [...new Set(rules.map((r) => r.source).filter(Boolean))] as string[],
    [rules],
  );

  const filteredRules = useMemo(() => {
    let result = rules;
    if (activeOnly) result = result.filter((r) => r.active);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => displayTitle(r).toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== 'all') result = result.filter((r) => displayCategory(r) === categoryFilter);
    if (sourceFilter !== 'all') result = result.filter((r) => r.source === sourceFilter);
    if (hotelFilter !== 'all') {
      if (hotelFilter === 'Group Wide') result = result.filter((r) => !r.hotel_id);
      else result = result.filter((r) => r.hotel_id === hotelFilter);
    }
    return result;
  }, [rules, search, categoryFilter, sourceFilter, hotelFilter, activeOnly]);

  const grouped = useMemo(() => {
    const map = new Map<string, Rule[]>(CATEGORY_ORDER.map((c) => [c, []]));
    for (const rule of filteredRules) {
      const cat = displayCategory(rule);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(rule);
    }
    return [...map.entries()].filter(([, rs]) => rs.length > 0);
  }, [filteredRules]);

  // Actions
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setSaveError(null);
    setModalState({ mode: 'add' });
  };

  const openEdit = (rule: Rule) => {
    setForm({
      title: rule.title ?? '',
      rule_category: rule.rule_category ?? '',
      hotel_id: rule.hotel_id ?? '',
      priority: rule.priority ?? '',
      source: rule.source ?? '',
      description: rule.description,
      active: rule.active,
    });
    setSaveError(null);
    setModalState({ mode: 'edit', rule });
  };

  const handleSave = async () => {
    if (!form.description.trim()) { setSaveError('Description is required.'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const body = {
        title: form.title || null,
        rule_category: form.rule_category || null,
        hotel_id: form.hotel_id || null,
        priority: form.priority || null,
        source: form.source || null,
        description: form.description,
        active: form.active,
      };
      const isEdit = modalState?.mode === 'edit';
      const ruleId = isEdit ? (modalState as { mode: 'edit'; rule: Rule }).rule.id : null;
      const res = await apiFetch(
        isEdit ? `${API_URL}/api/rules/${ruleId}` : `${API_URL}/api/rules`,
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `Error ${res.status}`);
      }
      setModalState(null);
      await fetchRules();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (rule: Rule) => {
    try {
      await apiFetch(`${API_URL}/api/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      });
      setDeactivateConfirm(null);
      await fetchRules();
    } catch { /* silent */ }
  };

  const handleReactivate = async (rule: Rule) => {
    try {
      await apiFetch(`${API_URL}/api/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      });
      await fetchRules();
    } catch { /* silent */ }
  };

  const toggleExpand = (id: number) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        isMobile={isMobile}
        isOpen={showAdminSidebar}
        onClose={() => setShowAdminSidebar(false)}
      />

      <div className={`flex-1 transition-all duration-300 ${showAdminSidebar && !isMobile ? 'ml-72' : 'ml-0'}`}>
        <UserPanel isOpen={isUserPanelOpen} onClose={() => setIsUserPanelOpen(false)} />

        <AdminHeader
          showSidebar={showAdminSidebar}
          onToggleSidebar={() => setShowAdminSidebar(!showAdminSidebar)}
          onOpenHotelSelector={() => setIsHotelModalOpen(true)}
          onOpenUserPanel={() => setIsUserPanelOpen(true)}
          onOpenAccountSettings={() => setShowAccountSettings(true)}
          isMobile={isMobile}
        />

        <HotelSelectorModal isOpen={isHotelModalOpen} onClose={() => setIsHotelModalOpen(false)} />

        <main style={{ padding: '32px 32px 64px', maxWidth: 1400, margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Rules & Standards Log
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
                Group rules, site requirements and brand standards
              </p>
            </div>
            <button onClick={openAdd} style={primaryBtnStyle}>
              <Plus size={15} />
              Add Rule
            </button>
          </div>

          {/* Filter bar */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
            marginBottom: 24, background: '#fff',
            border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or description…"
                style={{ ...inputStyle, paddingLeft: 32, height: 36, width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={selectStyle}>
              <option value="all">All Categories</option>
              {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={selectStyle}>
              <option value="all">All Sources</option>
              {distinctSources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={hotelFilter} onChange={(e) => setHotelFilter(e.target.value)} style={selectStyle}>
              <option value="all">All Hotels</option>
              <option value="Group Wide">Group Wide</option>
              {HOTELS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                style={{ accentColor: '#2563eb', width: 15, height: 15 }}
              />
              Active Only
            </label>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
          ) : grouped.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              No rules match the current filters.
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Category', 'Source', 'Hotel', 'Title / Description', 'Priority', 'Updated', 'Actions'].map((col) => (
                      <th key={col} style={{
                        padding: '10px 14px', textAlign: 'left', fontSize: 12,
                        fontWeight: 600, color: '#64748b', letterSpacing: '0.04em',
                        borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grouped.map(([cat, catRules]) => (
                    <Fragment key={cat}>
                      {/* Group header row */}
                      <tr style={{ background: '#f1f5f9' }}>
                        <td colSpan={7} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.05em' }}>
                          {cat}
                          <span style={{ marginLeft: 8, fontWeight: 400, color: '#94a3b8' }}>
                            ({catRules.length} {catRules.length === 1 ? 'rule' : 'rules'})
                          </span>
                        </td>
                      </tr>

                      {catRules.map((rule) => {
                        const isExpanded = expandedIds.has(rule.id);
                        const catSty = CATEGORY_STYLE[cat] ?? CATEGORY_STYLE['Uncategorised'];
                        const priSty = rule.priority ? (PRIORITY_STYLE[rule.priority] ?? null) : null;

                        return (
                          <tr key={rule.id} style={{ opacity: rule.active ? 1 : 0.45 }}>
                            {/* Category */}
                            <td style={cellStyle}>
                              <span style={{ ...catSty, padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {cat}
                              </span>
                            </td>

                            {/* Source */}
                            <td style={{ ...cellStyle, color: '#475569', maxWidth: 140 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {rule.source ?? <span style={{ color: '#cbd5e1' }}>—</span>}
                              </div>
                            </td>

                            {/* Hotel */}
                            <td style={{ ...cellStyle, color: '#475569', whiteSpace: 'nowrap' }}>
                              {rule.hotel_id ?? 'Group Wide'}
                            </td>

                            {/* Title / Description */}
                            <td style={{ ...cellStyle, maxWidth: 380 }}>
                              <div style={{ fontWeight: 500, color: '#0f172a', marginBottom: 3, fontSize: 13 }}>
                                {displayTitle(rule)}
                              </div>
                              <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>
                                {isExpanded
                                  ? rule.description
                                  : rule.description.slice(0, 120) + (rule.description.length > 120 ? '…' : '')}
                                {rule.description.length > 120 && (
                                  <button
                                    onClick={() => toggleExpand(rule.id)}
                                    style={{ marginLeft: 6, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0, fontWeight: 500 }}
                                  >
                                    {isExpanded ? 'Hide' : 'View'}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Priority */}
                            <td style={cellStyle}>
                              {priSty && rule.priority ? (
                                <span style={{ ...priSty, padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {rule.priority}
                                </span>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>—</span>
                              )}
                            </td>

                            {/* Updated */}
                            <td style={{ ...cellStyle, color: '#94a3b8', whiteSpace: 'nowrap', fontSize: 12 }}>
                              {rule.updated_at ? timeAgo(rule.updated_at) : '—'}
                            </td>

                            {/* Actions */}
                            <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button onClick={() => openEdit(rule)} style={actionBtnStyle}>
                                  Edit
                                </button>
                                {deactivateConfirm === rule.id ? (
                                  <>
                                    <button
                                      onClick={() => handleDeactivate(rule)}
                                      style={{ ...actionBtnStyle, color: '#dc2626', borderColor: '#fca5a5' }}
                                    >
                                      Confirm
                                    </button>
                                    <button onClick={() => setDeactivateConfirm(null)} style={actionBtnStyle}>
                                      Cancel
                                    </button>
                                  </>
                                ) : rule.active ? (
                                  <button
                                    onClick={() => setDeactivateConfirm(rule.id)}
                                    style={{ ...actionBtnStyle, color: '#64748b' }}
                                  >
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReactivate(rule)}
                                    style={{ ...actionBtnStyle, color: '#16a34a', borderColor: '#86efac' }}
                                  >
                                    Reactivate
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Modal */}
      {modalState && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalState(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                {modalState.mode === 'add' ? 'Add Rule' : 'Edit Rule'}
              </h2>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={labelStyle}>
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Leave blank to use description preview"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Rule Category
                <select value={form.rule_category} onChange={(e) => setForm({ ...form, rule_category: e.target.value })} style={inputStyle}>
                  <option value="">— select —</option>
                  {['JMK Master', 'Site Specific', 'Brand Standard', 'Other Brand', 'Uncategorised'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Hotel
                <select value={form.hotel_id} onChange={(e) => setForm({ ...form, hotel_id: e.target.value })} style={inputStyle}>
                  <option value="">Group Wide</option>
                  {HOTELS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>

              <label style={labelStyle}>
                Priority
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
                  <option value="">— none —</option>
                  {['Critical', 'High', 'Medium', 'Low'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Source
                <input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="e.g. Marriott Brand Standards 2024"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Description <span style={{ color: '#dc2626' }}>*</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={6}
                  placeholder="Full rule text…"
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  style={{ accentColor: '#2563eb', width: 15, height: 15 }}
                />
                Active
              </label>

              {saveError && (
                <p style={{ margin: 0, fontSize: 13, color: '#dc2626' }}>{saveError}</p>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModalState(null)} style={{ ...actionBtnStyle, padding: '8px 18px', fontSize: 14 }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 18px', borderRadius: 7, border: 'none',
                  backgroundColor: saving ? '#93c5fd' : '#2563eb',
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared style constants ────────────────────────────────────────────────────

const selectStyle: CSSProperties = {
  height: 36, padding: '0 10px', border: '1px solid #e2e8f0',
  borderRadius: 6, fontSize: 13, color: '#374151',
  background: '#fff', cursor: 'pointer', outline: 'none',
};

const inputStyle: CSSProperties = {
  padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6,
  fontSize: 13, color: '#0f172a', outline: 'none', width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 5,
  fontSize: 13, fontWeight: 500, color: '#374151',
};

const cellStyle: CSSProperties = {
  padding: '12px 14px', verticalAlign: 'top',
  fontSize: 13, borderBottom: '1px solid #f1f5f9',
};

const actionBtnStyle: CSSProperties = {
  padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 6,
  background: 'transparent', color: '#374151', fontSize: 12,
  cursor: 'pointer', fontFamily: 'inherit',
};

const primaryBtnStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', borderRadius: 8, border: 'none',
  backgroundColor: '#2563eb', color: '#fff',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
